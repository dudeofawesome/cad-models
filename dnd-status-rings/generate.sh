#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scad_file="$script_dir/ring.scad"

csv_file="$script_dir/rings.csv"
output_dir="$script_dir/output"
inner_diam_inches="1"
ring_thickness="6"
height="3"
fillet_rad="1.25"
ring_extruder="1"
text_extruder="2"
outer_wall_line_width="0.3"

usage() {
    printf '%s\n' \
        "Usage: $0 [options]" \
        "" \
        "Options:" \
        "  --csv PATH                    CSV file with name,count columns" \
        "                                (default: rings.csv)" \
        "  --output-dir PATH             Output directory" \
        "  --inner-diam-inches VALUE     Inner ring diameter in inches" \
        "  --ring-thickness MM           Ring wall thickness" \
        "  --height MM                   Ring height" \
        "  --fillet-rad MM               Ring fillet radius" \
        "  --ring-extruder INDEX         Extruder for the ring body" \
        "                                (default: 1)" \
        "  --text-extruder INDEX         Extruder for the raised text" \
        "                                (default: 2)" \
        "  --outer-wall-line-width MM    Override outer wall line width" \
        "                                (default: 0.3)" \
        "  -h, --help                    Show this help"
}

require_value() {
    if [[ $# -lt 2 || "$2" == --* ]]; then
        printf 'Missing value for %s\n' "$1" >&2
        exit 2
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --csv) require_value "$@"; csv_file="$2"; shift 2 ;;
        --output-dir) require_value "$@"; output_dir="$2"; shift 2 ;;
        --inner-diam-inches)
            require_value "$@"
            inner_diam_inches="$2"
            shift 2
            ;;
        --ring-thickness) require_value "$@"; ring_thickness="$2"; shift 2 ;;
        --height) require_value "$@"; height="$2"; shift 2 ;;
        --fillet-rad) require_value "$@"; fillet_rad="$2"; shift 2 ;;
        --ring-extruder) require_value "$@"; ring_extruder="$2"; shift 2 ;;
        --text-extruder) require_value "$@"; text_extruder="$2"; shift 2 ;;
        --outer-wall-line-width)
            require_value "$@"
            outer_wall_line_width="$2"
            shift 2
            ;;
        -h|--help) usage; exit 0 ;;
        *)
            printf 'Unknown option: %s\n' "$1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

if [[ ! -f "$csv_file" ]]; then
    printf 'CSV file not found: %s\n' "$csv_file" >&2
    exit 1
fi

if [[ ! "$ring_extruder" =~ ^[0-9]+$ ]]; then
    printf 'Invalid ring extruder: %s\n' "$ring_extruder" >&2
    exit 1
fi

if [[ ! "$text_extruder" =~ ^[0-9]+$ ]]; then
    printf 'Invalid text extruder: %s\n' "$text_extruder" >&2
    exit 1
fi

if [[ ! "$outer_wall_line_width" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
    printf 'Invalid outer wall line width: %s\n' "$outer_wall_line_width" >&2
    exit 1
fi

openscad_bin=""
if command -v openscad >/dev/null 2>&1; then
    openscad_bin="openscad"
elif command -v openscad-unstable >/dev/null 2>&1; then
    openscad_bin="openscad-unstable"
else
    printf 'Neither openscad nor openscad-unstable was found on PATH.\n' >&2
    printf 'Install OpenSCAD or add its CLI binary to PATH, then rerun this script.\n' >&2
    exit 127
fi

if ! command -v zip >/dev/null 2>&1; then
    printf 'zip was not found on PATH.\n' >&2
    exit 127
fi

if ! command -v unzip >/dev/null 2>&1; then
    printf 'unzip was not found on PATH.\n' >&2
    exit 127
fi

mkdir -p "$output_dir"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/private/tmp/status-ring-font-cache}"

scad_string() {
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    printf '"%s"' "$value"
}

slugify() {
    local value="$1"
    value="${value// /-}"
    value="${value//\//-}"
    value="${value//\\/-}"
    printf '%s' "$value"
}

xml_attr_escape() {
    local value="$1"
    value="${value//&/&amp;}"
    value="${value//\"/&quot;}"
    value="${value//</&lt;}"
    value="${value//>/&gt;}"
    printf '%s' "$value"
}

render_ring() {
    local name="$1"
    local output="$2"

    "$openscad_bin" \
        --enable textmetrics \
        --enable lazy-union \
        -o "$output" \
        -D "status_text=$(scad_string "$name")" \
        -D "inner_diam_inches=$inner_diam_inches" \
        -D "ring_thickness=$ring_thickness" \
        -D "height=$height" \
        -D "fillet_rad=$fillet_rad" \
        "$scad_file"
}

add_model_settings() {
    local package="$1"
    local package_dir tmp_dir model_file settings_file
    local model_name ring_object_id text_object_id assembly_object_id object_id
    local escaped_model_name escaped_package

    package_dir="$(cd "$(dirname "$package")" && pwd)"
    package="$package_dir/$(basename "$package")"
    model_name="${2:-$(basename "$package" .3mf)}"

    tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/status-ring-3mf.XXXXXX")"
    unzip -q "$package" -d "$tmp_dir"

    model_file="$tmp_dir/3D/3dmodel.model"
    if [[ ! -f "$model_file" ]]; then
        printf '3MF model file not found in %s\n' "$package" >&2
        rm -rf "$tmp_dir"
        exit 1
    fi

    build_object_ids=()
    while IFS= read -r object_id; do
        build_object_ids+=("$object_id")
    done < <(
        sed -n 's/.*<item[^>]*objectid="\([^"]*\)".*/\1/p' "$model_file"
    )

    if [[ "${#build_object_ids[@]}" -lt 2 ]]; then
        printf 'Expected at least two build objects in %s\n' "$package" >&2
        rm -rf "$tmp_dir"
        exit 1
    fi

    ring_object_id="${build_object_ids[0]}"
    text_object_id="${build_object_ids[1]}"

    assembly_object_id="0"
    while IFS= read -r object_id; do
        if [[ "$object_id" -gt "$assembly_object_id" ]]; then
            assembly_object_id="$object_id"
        fi
    done < <(
        perl -ne 'print "$1\n" if /<object\b[^>]*\bid="([0-9]+)"/' "$model_file"
    )
    assembly_object_id=$((assembly_object_id + 1))
    escaped_model_name="$(xml_attr_escape "$model_name")"
    escaped_package="$(xml_attr_escape "$package")"

    ASSEMBLY_OBJECT_ID="$assembly_object_id" \
    RING_OBJECT_ID="$ring_object_id" \
    TEXT_OBJECT_ID="$text_object_id" \
    MODEL_NAME="$escaped_model_name" \
    perl -0pi -e '
        my $assembly = qq{\t\t<object id="$ENV{ASSEMBLY_OBJECT_ID}" name="$ENV{MODEL_NAME}" type="model">\n}
            . qq{\t\t\t<components>\n}
            . qq{\t\t\t\t<component objectid="$ENV{RING_OBJECT_ID}"/>\n}
            . qq{\t\t\t\t<component objectid="$ENV{TEXT_OBJECT_ID}"/>\n}
            . qq{\t\t\t</components>\n}
            . qq{\t\t</object>\n};
        s{\t</resources>}{${assembly}\t</resources>}s;
        s{<build([^>]*)>.*?</build>}{<build$1>\n\t\t<item objectid="$ENV{ASSEMBLY_OBJECT_ID}" partnumber="Part 1"/>\n\t</build>}s;
    ' "$model_file"

    mkdir -p "$tmp_dir/Metadata"
    settings_file="$tmp_dir/Metadata/model_settings.config"
    cat > "$settings_file" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="$assembly_object_id">
    <metadata key="name" value="$escaped_model_name"/>
    <metadata key="extruder" value="0"/>

    <metadata key="wall_generator" value="arachne"/>
    <metadata key="min_bead_width" value="50%"/>

    <part id="$ring_object_id" subtype="normal_part">
      <metadata key="name" value="ring"/>
      <metadata key="source_file" value="$escaped_package"/>
      <metadata key="source_object_id" value="0"/>
      <metadata key="source_volume_id" value="0"/>
      <metadata key="extruder" value="$ring_extruder"/>
      <mesh_stat edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
    <part id="$text_object_id" subtype="normal_part">
      <metadata key="name" value="text"/>
      <metadata key="source_file" value="$escaped_package"/>
      <metadata key="source_object_id" value="1"/>
      <metadata key="source_volume_id" value="0"/>
      <metadata key="extruder" value="$text_extruder"/>
      <mesh_stat edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
  </object>

  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value=""/>
    <metadata key="locked" value="false"/>
    <metadata key="filament_map_mode" value="Auto For Flush"/>
    <metadata key="filament_maps" value="1 1 1 1"/>
    <model_instance>
      <metadata key="object_id" value="$assembly_object_id"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
  </plate>
  <assemble>
   <assemble_item object_id="$assembly_object_id" instance_id="0" transform="1 0 0 0 1 0 0 0 1 0 0 0" offset="0 0 0" />
  </assemble>
</config>
EOF

    (
        cd "$tmp_dir"
        zip -qr "$package" .
    )

    rm -rf "$tmp_dir"
}

line_number=0
while IFS=, read -r name count extra || [[ -n "${name:-}" ]]; do
    line_number=$((line_number + 1))

    name="${name//$'\r'/}"
    count="${count:-}"
    count="${count//$'\r'/}"

    if [[ $line_number -eq 1 && "$name" == "name" ]]; then
        continue
    fi

    if [[ -z "$name" && -z "$count" ]]; then
        continue
    fi

    if [[ -n "${extra:-}" ]]; then
        printf 'Unexpected extra CSV field on line %s\n' "$line_number" >&2
        exit 1
    fi

    if [[ -z "$name" ]]; then
        printf 'Missing name on line %s\n' "$line_number" >&2
        exit 1
    fi

    if [[ -z "$count" ]]; then
        count="1"
    fi

    if [[ ! "$count" =~ ^[0-9]+$ || "$count" -lt 1 ]]; then
        printf 'Invalid count on line %s: %s\n' "$line_number" "$count" >&2
        exit 1
    fi

    file_name="$(slugify "$name")"
    for ((copy = 1; copy <= count; copy++)); do
        if [[ "$count" -eq 1 ]]; then
            output="$output_dir/$file_name.3mf"
        else
            output="$output_dir/$file_name-$copy.3mf"
        fi

        render_ring "$name" "$output"
        add_model_settings "$output" "$name"
    done
done < "$csv_file"
