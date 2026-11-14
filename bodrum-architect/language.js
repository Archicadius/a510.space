// The shared property-page selector controls the document language.
function updateLocalizedContent() {
  document.getElementById('telegram-contact').href =
    'https://t.me/a510_luna_bot?start=bodrum_' + document.documentElement.lang;
  const key = 'data-alt-' + document.documentElement.lang;
  for (const image of document.querySelectorAll('img[data-alt-ru]')) {
    image.alt = image.getAttribute(key);
  }
}
updateLocalizedContent();
new MutationObserver(updateLocalizedContent).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['lang']
});
