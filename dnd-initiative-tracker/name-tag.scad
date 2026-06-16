// Parametric magnetic-tape name tag.
//
// Defaults match Louis.step:
// - 50 mm x 13.335 mm body
// - 2.024 mm body thickness
// - 13.335 mm centered square pocket on the back
// - 1.524 mm pocket depth
// - 0.5 mm raised text

person_name = "Louis";
font_name = "Herculanum";

tag_length = 50;
tag_width = 13.335;
tag_thickness = 2.024;

tape_size = 13.335;
tape_depth = 1.524;
tape_clearance = 0.2;

text_size = 8.5;
text_min_size = 4.25;
text_height = 0.5;
text_y_offset = 0;
text_margin = 2;
text_line_gap = 1.0;

show_back_initials = true;
back_initials_size = 7;
back_initials_depth = 0.35;
back_initials_margin = 1.5;

corner_radius = 0;
pocket_corner_radius = 0;

// Set to "all", "base", "text", or "initials". Export separate parts
// for a multi-color/multi-part setup in Orca Slicer.
part = "all";

$fn = 48;

module rounded_rect_2d(size, radius) {
    if (radius <= 0) {
        square(size, center = true);
    } else {
        offset(r = radius)
            square([size[0] - 2 * radius, size[1] - 2 * radius], center = true);
    }
}

module rounded_box(size, radius) {
    linear_extrude(height = size[2])
        rounded_rect_2d([size[0], size[1]], radius);
}

module body() {
    difference() {
        rounded_box([tag_length, tag_width, tag_thickness], corner_radius);

        translate([0, 0, -0.01])
            linear_extrude(height = min(tape_depth, tag_thickness) + 0.02)
                rounded_rect_2d(
                    [tape_size + tape_clearance, tape_size + tape_clearance],
                    pocket_corner_radius
                );

        if (show_back_initials) {
            back_initials_void();
        }
    }
}

function clamp(value, min_value, max_value) =
    min(max(value, min_value), max_value);

function usable_text_width() = tag_length - 2 * text_margin;

function usable_text_height() = tag_width - 2 * text_margin;

function string_slice(value, start, end, i = undef) =
    let(current = i == undef ? start : i)
    current >= end
        ? ""
        : str(value[current], string_slice(value, start, end, current + 1));

function initials_from(value, i = 0) =
    i >= len(value)
        ? ""
        : str(
            value[i] != " " && (i == 0 || value[i - 1] == " ")
                ? value[i]
                : "",
            initials_from(value, i + 1)
        );

function left_initials(value) =
    let(initials = initials_from(value))
    len(initials) <= 1
        ? initials
        : string_slice(initials, 0, ceil(len(initials) / 2));

function right_initials(value) =
    let(initials = initials_from(value))
    len(initials) <= 1
        ? ""
        : string_slice(initials, ceil(len(initials) / 2), len(initials));

function space_indices(value) = search(" ", value, 0)[0];

function text_metrics(line, size = text_size) =
    textmetrics(
        line,
        size = size,
        font = font_name,
        halign = "center",
        valign = "center"
    );

function text_width(line, size = text_size) =
    text_metrics(line, size).size[0];

function text_box_height(line, size = text_size) =
    text_metrics(line, size).size[1];

function fit_line_size(line) =
    text_width(line) <= 0
        ? text_size
        : min(text_size, text_size * usable_text_width() / text_width(line));

function fit_box_size(line, max_size, max_width, max_height) =
    text_width(line, max_size) <= 0 || text_box_height(line, max_size) <= 0
        ? max_size
        : min(
            max_size,
            max_size * max_width / text_width(line, max_size),
            max_size * max_height / text_box_height(line, max_size)
        );

function split_line_1(value, split_at) = string_slice(value, 0, split_at);

function split_line_2(value, split_at) = string_slice(value, split_at + 1, len(value));

function split_score(value, split_at) =
    let(
        width_1 = text_width(split_line_1(value, split_at)),
        width_2 = text_width(split_line_2(value, split_at))
    )
    [abs(width_1 - width_2), max(width_1, width_2), split_at];

function better_split(a, b) =
    a[0] < b[0] || (a[0] == b[0] && a[1] < b[1]) ? a : b;

function best_split_score(value, spaces, i = 0, best = undef) =
    i >= len(spaces)
        ? best
        : best_split_score(
            value,
            spaces,
            i + 1,
            best == undef
                ? split_score(value, spaces[i])
                : better_split(best, split_score(value, spaces[i]))
        );

function best_split_index(value) =
    let(spaces = space_indices(value))
    len(spaces) == 0 ? undef : best_split_score(value, spaces)[2];

function fit_two_line_size(line1, line2) =
    let(
        line1_height_ratio = text_box_height(line1) / text_size,
        line2_height_ratio = text_box_height(line2) / text_size,
        height_size =
            (usable_text_height() - text_line_gap)
            / (line1_height_ratio + line2_height_ratio)
    )
    min(text_size, fit_line_size(line1), fit_line_size(line2), height_size);

function fit_text_size(line1, line2 = "") =
    line2 == ""
        ? clamp(min(text_size, fit_line_size(line1)), text_min_size, text_size)
        : clamp(
            fit_two_line_size(line1, line2),
            text_min_size,
            text_size
        );

module text_line(line, size, y) {
    translate([0, text_y_offset + y, tag_thickness])
        linear_extrude(height = text_height)
            text(
                line,
                size = size,
                font = font_name,
                halign = "center",
                valign = "center"
            );
}

module back_initials_text(line, x) {
    section_width =
        max(0.1, (tag_length - (tape_size + tape_clearance)) / 2 - 2 * back_initials_margin);
    section_height = max(0.1, tag_width - 2 * back_initials_margin);
    fitted_size = fit_box_size(line, back_initials_size, section_width, section_height);

    if (line != "") {
        translate([x, 0])
            mirror([1, 0])
                text(
                    line,
                    size = fitted_size,
                    font = font_name,
                    halign = "center",
                    valign = "center"
                );
    }
}

module back_initials_3d(extra_depth = 0) {
    pocket_width = tape_size + tape_clearance;
    side_center = (tag_length + pocket_width) / 4;

    if (show_back_initials) {
        translate([0, 0, -extra_depth])
            linear_extrude(height = min(back_initials_depth, tag_thickness) + 2 * extra_depth) {
                back_initials_text(left_initials(person_name), side_center);
                back_initials_text(right_initials(person_name), -side_center);
            }
    }
}

module back_initials_void() {
    back_initials_3d(0.01);
}

module back_initials_inlay() {
    back_initials_3d(0);
}

module raised_name(text) {
    single_fit_size = min(text_size, fit_line_size(text));
    single_line_size = clamp(single_fit_size, text_min_size, text_size);
    split_at = best_split_index(text);
    should_split = single_fit_size < text_min_size && split_at != undef;
    line1 = should_split ? split_line_1(text, split_at) : text;
    line2 = should_split ? split_line_2(text, split_at) : "";
    fitted_size = should_split ? fit_text_size(line1, line2) : single_line_size;
    line1_metrics = text_metrics(line1, fitted_size);
    line2_metrics = line2 == "" ? line1_metrics : text_metrics(line2, fitted_size);
    center_shift = (line2_metrics.size[1] - line1_metrics.size[1]) / 2;
    line1_y = line2 == ""
        ? 0
        : center_shift + text_line_gap / 2 - line1_metrics.position[1];
    line2_y = line2 == ""
        ? 0
        : center_shift
            - text_line_gap / 2
            - (line2_metrics.position[1] + line2_metrics.size[1]);

    if (line2 == "") {
        text_line(line1, fitted_size, 0);
    } else {
        text_line(line1, fitted_size, line1_y);
        text_line(line2, fitted_size, line2_y);
    }
}

if (part == "base") {
    body();
} else if (part == "text") {
    raised_name(person_name);
} else if (part == "initials") {
    back_initials_inlay();
} else {
    color("black") body();
    color("white") raised_name(person_name);
    color("white") back_initials_inlay();
}
