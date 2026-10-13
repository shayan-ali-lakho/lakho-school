// School details. The name comes from the school's logo; phone and email were supplied by the school.
// address and principalName are still unknown: set them to a string and they appear on the site.
export const site = {
  name: "Dr. G.M. Lakho Memorial Sec. School",
  shortName: "G.M. Lakho School",
  tagline: "A school where every child is known by name.",
  email: "gmlakho@gmail.com",
  phone: "0330 8410768",
  phoneHref: "tel:+923308410768",
  whatsappHref: "https://wa.me/923308410768",
  address: null as string | null,
  hours: "Monday to Friday, 8:00 am to 2:00 pm",
  admissionsNote: "Admissions open 2026–27",
  principalName: null as string | null,
};

export const CLASS_OPTIONS = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
