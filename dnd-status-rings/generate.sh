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
    local ring_object_id text_object_id

    package_dir="$(cd "$(dirname "$package")" && pwd)"
    package="$package_dir/$(basename "$package")"

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

    mkdir -p "$tmp_dir/Metadata"
    settings_file="$tmp_dir/Metadata/model_settings.config"
    cat > "$settings_file" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="$ring_object_id">
    <metadata key="name" value="ring"/>
    <metadata key="extruder" value="$ring_extruder"/>
  </object>
  <object id="$text_object_id">
    <metadata key="name" value="text"/>
    <metadata key="extruder" value="$text_extruder"/>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value=""/>
    <metadata key="locked" value="false"/>
    <metadata key="filament_map_mode" value="Auto For Flush"/>
    <metadata key="filament_maps" value="$ring_extruder $text_extruder"/>
    <model_instance>
      <metadata key="object_id" value="$ring_object_id"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
    <model_instance>
      <metadata key="object_id" value="$text_object_id"/>
      <metadata key="instance_id" value="1"/>
    </model_instance>
  </plate>
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
        add_model_settings "$output"
    done
done < "$csv_file"
