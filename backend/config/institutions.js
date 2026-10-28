export const INSTITUTION_DOMAINS = {
  "iiuc.edu.bd": "International Islamic University Chittagong (IIUC)",
  "cuet.ac.bd": "Chittagong University of Engineering & Technology (CUET)",
  "buet.ac.bd": "Bangladesh University of Engineering and Technology (BUET)",
  "du.ac.bd": "University of Dhaka",
  "ru.ac.bd": "University of Rajshahi",
  "cu.ac.bd": "University of Chittagong",
  "kuet.ac.bd": "Khulna University of Engineering & Technology (KUET)",
  "ruet.ac.bd": "Rajshahi University of Engineering & Technology (RUET)",
  "just.edu.bd": "Jashore University of Science and Technology (JUST)",
  "bracu.ac.bd": "BRAC University",
  "nsu.edu.bd": "North South University",
  "aust.edu": "Ahsanullah University of Science and Technology (AUST)",
  "juniv.edu": "Jahangirnagar University",
  "sust.edu": "Shahjalal University of Science and Technology (SUST)",
};

/**
 * Given an email address, returns { domain, name } if it matches a known
 * institution domain (exact match or subdomain), otherwise null.
 */
export function detectInstitution(email) {
  if (!email || !email.includes("@")) return null;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0]) return null;
  const domain = parts[1];
  const matched = Object.keys(INSTITUTION_DOMAINS).find(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
  return matched ? { domain: matched, name: INSTITUTION_DOMAINS[matched] } : null;
}
