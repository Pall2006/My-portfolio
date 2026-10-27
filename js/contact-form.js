// Форма: отправляем сообщение на почту через Web3Forms и показываем «Спасибо!» или ошибку
const CONTACT_KEY = '5fef7f16-73fd-42b3-abbe-519b93ea165e';
const box = document.getElementById('contact-box');
const form = document.getElementById('contact-form');
const contactError = document.getElementById('contact-error');
const contactButton = form.querySelector('button[type="submit"]');

// true — письмо принято, false — любая ошибка (нет сети, 15 с без ответа, не 2xx, не JSON, success не true)
async function contactSend(data) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: CONTACT_KEY,
        subject: 'Новое сообщение с сайта-портфолио',
        name: data.get('name'),
        email: data.get('email'),
        message: data.get('message'),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch (err) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (contactButton.disabled) return;
  contactError.hidden = true;
  contactButton.disabled = true;
  contactButton.textContent = 'Отправляем…';
  const ok = await contactSend(new FormData(form));
  if (ok) {
    box.classList.add('sent');
    form.reset();
  } else {
    contactError.hidden = false;
  }
  contactButton.disabled = false;
  contactButton.textContent = 'Отправить';
});
document.getElementById('again').addEventListener('click', () => {
  box.classList.remove('sent');
});
