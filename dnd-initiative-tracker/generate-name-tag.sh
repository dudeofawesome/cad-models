#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
scad_file="$script_dir/name-tag.scad"

name="Louis"
font="Herculanum"
tag_length="50"
tag_width="13.335"
tag_thickness="2.024"
tape_size="13.335"
tape_depth="1.524"
tape_clearance="0.2"
text_size="8.5"
text_min_size="4.25"
text_height="0.5"
text_y_offset="0"
text_margin="2"
text_line_gap="1.0"
show_back_initials="true"
back_initials_size="7"
back_initials_depth="0.35"
back_initials_margin="1.5"
corner_radius="0"
pocket_corner_radius="0"
output_dir="$script_dir/output"
split_colors="0"

usage() {
    printf '%s\n' \
        "Usage: $0 [options]" \
        "" \
        "Options:" \
        "  --name VALUE                  Name to place on the tag" \
        "  --font VALUE                  OpenSCAD font name (default: Herculanum)" \
        "  --tag-length MM               Tag length" \
        "  --tag-width MM                Tag width" \
        "  --tag-thickness MM            Tag body thickness" \
        "  --tape-size MM                Square magnetic tape pocket size" \
        "  --tape-depth MM               Magnetic tape pocket depth" \
        "  --tape-clearance MM           Extra pocket clearance" \
        "  --text-size MM                Text size" \
        "  --text-min-size MM            Smallest automatic text size" \
        "  --text-height MM              Raised text extrusion height" \
        "  --text-y-offset MM            Move text up/down across tag width" \
        "  --text-margin MM              Left/right and top/bottom text margin" \
        "  --text-line-gap MM            Vertical gap between two text lines" \
        "  --back-initials-size MM       Back initials max text size" \
        "  --back-initials-depth MM      Back initials flush inlay depth" \
        "  --back-initials-margin MM     Back initials side-region margin" \
        "  --no-back-initials            Disable back initials" \
        "  --corner-radius MM            Outer corner radius" \
        "  --pocket-corner-radius MM     Pocket corner radius" \
        "  --output-dir PATH             Output directory" \
        "  --split-colors                Export base and text STLs separately" \
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
        --name) require_value "$@"; name="$2"; shift 2 ;;
        --font) require_value "$@"; font="$2"; shift 2 ;;
        --tag-length) require_value "$@"; tag_length="$2"; shift 2 ;;
        --tag-width) require_value "$@"; tag_width="$2"; shift 2 ;;
        --tag-thickness) require_value "$@"; tag_thickness="$2"; shift 2 ;;
        --tape-size) require_value "$@"; tape_size="$2"; shift 2 ;;
        --tape-depth) require_value "$@"; tape_depth="$2"; shift 2 ;;
        --tape-clearance) require_value "$@"; tape_clearance="$2"; shift 2 ;;
        --text-size) require_value "$@"; text_size="$2"; shift 2 ;;
        --text-min-size) require_value "$@"; text_min_size="$2"; shift 2 ;;
        --text-height) require_value "$@"; text_height="$2"; shift 2 ;;
        --text-y-offset) require_value "$@"; text_y_offset="$2"; shift 2 ;;
        --text-margin) require_value "$@"; text_margin="$2"; shift 2 ;;
        --text-line-gap)
            require_value "$@"
            text_line_gap="$2"
            shift 2
            ;;
        --back-initials-size)
            require_value "$@"
            back_initials_size="$2"
            shift 2
            ;;
        --back-initials-depth)
            require_value "$@"
            back_initials_depth="$2"
            shift 2
            ;;
        --back-initials-margin)
            require_value "$@"
            back_initials_margin="$2"
            shift 2
            ;;
        --no-back-initials) show_back_initials="false"; shift ;;
        --corner-radius) require_value "$@"; corner_radius="$2"; shift 2 ;;
        --pocket-corner-radius)
            require_value "$@"
            pocket_corner_radius="$2"
            shift 2
            ;;
        --output-dir) require_value "$@"; output_dir="$2"; shift 2 ;;
        --split-colors) split_colors="1"; shift ;;
        -h|--help) usage; exit 0 ;;
        *)
            printf 'Unknown option: %s\n' "$1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

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
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/private/tmp/name-tag-font-cache}"

file_name="${name// /-}"
file_name="${file_name//\//-}"

scad_string() {
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    printf '"%s"' "$value"
}

defs=(
    -D "person_name=$(scad_string "$name")"
    -D "font_name=$(scad_string "$font")"
    -D "tag_length=$tag_length"
    -D "tag_width=$tag_width"
    -D "tag_thickness=$tag_thickness"
    -D "tape_size=$tape_size"
    -D "tape_depth=$tape_depth"
    -D "tape_clearance=$tape_clearance"
    -D "text_size=$text_size"
    -D "text_min_size=$text_min_size"
    -D "text_height=$text_height"
    -D "text_y_offset=$text_y_offset"
    -D "text_margin=$text_margin"
    -D "text_line_gap=$text_line_gap"
    -D "show_back_initials=$show_back_initials"
    -D "back_initials_size=$back_initials_size"
    -D "back_initials_depth=$back_initials_depth"
    -D "back_initials_margin=$back_initials_margin"
    -D "corner_radius=$corner_radius"
    -D "pocket_corner_radius=$pocket_corner_radius"
)

render_part() {
    local part="$1"
    local output="$2"

    "$openscad_bin" \
        --enable textmetrics \
        --enable lazy-union \
        -o "$output" \
        "${defs[@]}" \
        -D "part=\"$part\"" \
        "$scad_file"
}

if [[ "$split_colors" == "1" ]]; then
    render_part "base" "$output_dir/$file_name-base.stl"
    render_part "text" "$output_dir/$file_name-text.stl"
    printf 'Wrote %s\n' "$output_dir/$file_name-base.stl"
    printf 'Wrote %s\n' "$output_dir/$file_name-text.stl"
    if [[ "$show_back_initials" == "true" ]]; then
        render_part "initials" "$output_dir/$file_name-initials.stl"
        printf 'Wrote %s\n' "$output_dir/$file_name-initials.stl"
    fi
else
    render_part "all" "$output_dir/$file_name.3mf"
    printf 'Wrote %s\n' "$output_dir/$file_name.3mf"
fi
