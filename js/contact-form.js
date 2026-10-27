// Форма: пока просто показываем «спасибо» (сохранение добавим позже)
const box = document.getElementById('contact-box');
const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  box.classList.add('sent');
  form.reset();
});
document.getElementById('again').addEventListener('click', () => {
  box.classList.remove('sent');
});
