// School details. The name comes from the school's logo; phone and email were supplied by the school.
// principalName is still unknown: set it to a string and it appears on the site.
export const site = {
  name: "Dr. G.M. Lakho Memorial Sec. School",
  shortName: "G.M. Lakho School",
  tagline: "A school where every child is known by name.",
  email: "shayanlakho25@gmail.com",
  phone: "0330 8410768",
  phoneHref: "tel:+923308410768",
  whatsappHref: "https://wa.me/923308410768",
  address: "H# 1728/1074, Muhallah Hussaini Nagar, Baldia Town, Karachi",
  hours: "7:45 am to 12:00 noon",
  admissionsNote: "Admissions open 2026–27",
  principalName: null as string | null,
};

export const CLASS_OPTIONS = ["Nursery", ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];
