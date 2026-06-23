// parametric status effect ring
// requires the BOSL library

include <BOSL/constants.scad>
use <BOSL/shapes.scad>
use <BOSL/transforms.scad>
use <BOSL/masks.scad>

function inch_to_mm(inch) = inch * 25.4;
function text_width(string, size, font) =
  let(
    metrics = textmetrics(string, size=size, font=font, halign="left", valign="baseline")
  )
  abs(metrics.offset[0]) + metrics.advance[0];
function arc_angle(length, radius) = length / radius * 180 / PI;
function str_toupper (string) =
  chr([for(s=string) let(c=ord(s)) c<123 && c>96 ?c-32:c]);

inner_diam_inches = 1;
ring_thickness = 6;
height = 3;
fillet_rad = 1.25;
status_text = "Concentrating";

inner_diam = inch_to_mm(inner_diam_inches * 1.005);
outer_diam = inner_diam + (ring_thickness * 2);
upper_status_text = str_toupper(status_text);

$fn = $preview ? 120 : 240;

// base
#color("black") difference() {
  cylinder(r=outer_diam / 2, h=height, center=true);
  cylinder(r=inner_diam / 2, h=height + 0.1, center=true);

  // fillets
  up(height / 2) fillet_cylinder_mask(r=outer_diam / 2, fillet=fillet_rad);
  up(height / 2) fillet_hole_mask(r=inner_diam / 2, fillet=fillet_rad);
  down(height / 2) mirror([0, 0, 1]) fillet_cylinder_mask(r=outer_diam / 2, fillet=fillet_rad);
  down(height / 2) mirror([0, 0, 1]) fillet_hole_mask(r=inner_diam / 2, fillet=fillet_rad);

  ring_status(upper_status_text);
}
// text
let(die_height = height * 2)
color("white") difference() {
  ring_status(upper_status_text);
  difference() {
    cylinder(r=outer_diam, h=die_height, center=true);
    cylinder(r=outer_diam / 2, h=die_height + 0.1, center=true);
  }
}



module ring_status(
  status_name,
  radius=(((outer_diam - inner_diam) / 2) * 9/10) + (inner_diam / 2),
  size=ring_thickness / 1.3,
  depth=height / 3.5,
  font="Arial:style=Bold",
  kerning=0.4,
  min_word_padding=10,
  start_angle = 0
) {
  word_deg = arc_angle(text_width(status_name, size, font) + kerning, radius);
  padded_word_deg = word_deg + arc_angle(min_word_padding * 2, radius);
  word_count = max(1, floor(360 / padded_word_deg));
  word_spacing = 360 / word_count;
  word_offset = (word_spacing - word_deg) / 2;
  echo(str("word_deg:", word_deg));
  echo(str("padded_word_deg:", padded_word_deg));
  echo(str("word_count:", word_count));
  echo(str("word_spacing:", word_spacing));

  module draw_letter(word, kerning, index = 0, last_angle = 0) {
    letter = word[index];
    letter_width = text_width(letter, size, font);

    next_angle = last_angle + arc_angle(letter_width + kerning, radius);

    rotate([0, 0, last_angle])
    translate([radius, 0, 0])
    rotate([0, 0, 90 + arc_angle(letter_width / 2, radius)]) {
      text(text=letter, size=size, font=font, halign="left", valign="baseline");
      if ($preview) #square([letter_width, .1]);
    }

    if (word[index + 1] != undef) draw_letter(word, kerning, index + 1, next_angle);
  }

  up((height / 2 - depth) + 0.1)
  linear_extrude(depth)
  for (word_index = [0 : word_count - 1]) {
    draw_letter(
      status_name,
      kerning,
      0,
      start_angle + word_offset + (word_index * word_spacing)
    );
  }
}
