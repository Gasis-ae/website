/* Site configuration — edit this file, no build step needed.
 *
 * FORM HANDLING
 * The site is fully static, so form submissions need somewhere to go.
 * Option A (recommended): sign up for a form-to-email service such as
 *   Formspree (https://formspree.io) or Basin (https://usebasin.com), create a
 *   form and paste its endpoint URL below, e.g. "https://formspree.io/f/abcdwxyz".
 * Option B: if hosting on Netlify, use Netlify Forms and set the endpoint to "/".
 * Option C: leave the endpoint empty. The form then opens the visitor's email
 *   client with the message pre-filled and addressed to the email below.
 */
window.GASIS_CONFIG = {
  // Contact page form ("Send")
  contactEndpoint: "",
  contactEmail: "business@gasis.ae",

  // Footer newsletter form ("Subscribe")
  newsletterEndpoint: "",
  newsletterEmail: "help@gasis.ae"
};
