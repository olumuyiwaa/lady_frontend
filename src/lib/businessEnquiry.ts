export type BusinessEnquiry = {
  company: string;
  sites: string;
  frequency: string;
  details: string;
};

/**
 * The storefront contact endpoint takes one free-text message, so a business
 * enquiry is flattened into labelled lines. Staff see it as a normal ticket
 * that starts with "[B2B enquiry]". Capped to the API's 3000 characters.
 */
export function composeBusinessMessage(e: BusinessEnquiry, labels: { company: string; sites: string; frequency: string }): string {
  const lines = [
    "[B2B enquiry]",
    `${labels.company}: ${e.company.trim()}`,
    `${labels.sites}: ${e.sites.trim()}`,
    `${labels.frequency}: ${e.frequency.trim()}`,
  ];
  const details = e.details.trim();
  if (details) lines.push("", details);
  return lines.join("\n").slice(0, 3000);
}
