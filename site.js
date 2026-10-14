// Shared by every page: footer year, mobile menu and the email copy buttons.

var year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

document.querySelectorAll('.menu-panel a').forEach(function (link) {
  link.addEventListener('click', function () { link.closest('details').open = false; });
});

// One live region announces the copy to screen readers.
var copyStatus = document.createElement('p');
copyStatus.className = 'visually-hidden';
copyStatus.setAttribute('role', 'status');
document.body.appendChild(copyStatus);

// Older browsers and some embedded views block the clipboard API, so fall back to execCommand.
function copyWithSelection(text) {
  var field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'absolute';
  field.style.left = '-9999px';
  document.body.appendChild(field);
  field.select();
  var ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(field);
  return ok ? Promise.resolve() : Promise.reject();
}

function copyText(text) {
  if (!navigator.clipboard || !window.isSecureContext) return copyWithSelection(text);
  return navigator.clipboard.writeText(text).catch(function () { return copyWithSelection(text); });
}

// If nothing can copy, select the address on screen so the reader can copy it by hand.
function selectAddress(button) {
  var link = button.parentElement.querySelector('a[href^="mailto:"]');
  if (!link) return;
  var range = document.createRange();
  range.selectNodeContents(link);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

document.querySelectorAll('.copy-btn').forEach(function (button) {
  button.addEventListener('click', function () {
    copyText(button.dataset.copy).then(function () {
      button.textContent = 'Copied';
      copyStatus.textContent = 'The email address is copied.';
    }, function () {
      selectAddress(button);
      button.textContent = 'Selected';
      copyStatus.textContent = 'The email address did not copy. It is now selected, so you can copy it yourself.';
    });
    setTimeout(function () { button.textContent = 'Copy'; copyStatus.textContent = ''; }, 2500);
  });
});
