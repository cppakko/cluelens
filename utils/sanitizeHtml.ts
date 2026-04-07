const BLOCKED_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'form',
  'input',
  'button',
  'textarea',
  'select',
]);

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function resolveUrl(rawValue: string, baseUrl?: string) {
  if (!rawValue || !baseUrl || rawValue.startsWith('#')) {
    return rawValue;
  }

  try {
    return new URL(rawValue, baseUrl).toString();
  }
  catch {
    return rawValue;
  }
}

function isSafeUrl(rawValue: string) {
  if (!rawValue) {
    return false;
  }

  if (rawValue.startsWith('/') || rawValue.startsWith('#')) {
    return true;
  }

  try {
    const url = new URL(rawValue, 'https://example.invalid');
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  }
  catch {
    return false;
  }
}

function shouldKeepAttribute(name: string, value: string) {
  if (name.startsWith('on')) {
    return false;
  }

  if (name === 'src' || name === 'href') {
    return isSafeUrl(value);
  }

  if (name === 'target') {
    return value === '_blank' || value === '_self';
  }

  if (name === 'rel') {
    return true;
  }

  return (
    name === 'class'
    || name === 'id'
    || name === 'title'
    || name === 'alt'
    || name === 'lang'
    || name === 'dir'
    || name === 'role'
    || name === 'tabindex'
    || name === 'width'
    || name === 'height'
    || name === 'srcset'
    || name === 'loading'
    || name.startsWith('aria-')
    || name.startsWith('data-')
  );
}

function sanitizeElement(element: Element, baseUrl?: string) {
  if (BLOCKED_TAGS.has(element.tagName.toLowerCase())) {
    element.remove();
    return;
  }

  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    const originalValue = attribute.value.trim();
    const value = name === 'src' || name === 'href'
      ? resolveUrl(originalValue, baseUrl)
      : originalValue;

    if (value !== originalValue) {
      element.setAttribute(attribute.name, value);
    }

    if (!shouldKeepAttribute(name, value)) {
      element.removeAttribute(attribute.name);
    }
  }

  if (element instanceof HTMLAnchorElement && element.getAttribute('target') === '_blank') {
    const existingRel = element.getAttribute('rel') ?? '';
    const relTokens = new Set(existingRel.split(/\s+/).filter(Boolean));
    relTokens.add('noopener');
    relTokens.add('noreferrer');
    element.setAttribute('rel', [...relTokens].join(' '));
  }

  for (const child of [...element.children]) {
    sanitizeElement(child, baseUrl);
  }
}

export function sanitizeHtml(html: string, baseUrl?: string) {
  if (!html) {
    return '';
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');

  for (const element of [...document.body.children]) {
    sanitizeElement(element, baseUrl);
  }

  return document.body.innerHTML;
}
