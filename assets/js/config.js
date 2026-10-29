/*
 * Site settings. Edit these values; no build step needed.
 *
 * formEndpoint        Where enquiry forms are POSTed as JSON (e.g. a Formspree,
 *                     Basin or Netlify Forms endpoint). Leave empty and the form
 *                     opens the visitor's email app with the enquiry written out.
 * newsletterEndpoint  Optional JSON endpoint for newsletter sign-ups. Empty sends
 *                     people to the existing sign-up page below, email prefilled.
 * calendarUrl         Optional booking link (Calendly, TidyCal...). Shown straight
 *                     after a 'Priority' enquiry so serious leads can book at once.
 */
window.HF_CONFIG = {
  contactEmail: 'vanessa@highfifteen.com',
  formEndpoint: '',
  newsletterEndpoint: '',
  newsletterFallback: 'https://www.highfifteen.com/newsletter-sign-up',
  calendarUrl: '',
  currency: '£'
};
