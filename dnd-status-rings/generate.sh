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
    done
done < "$csv_file"
