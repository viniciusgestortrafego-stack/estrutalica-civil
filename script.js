const whatsappUrl = 'https://wa.me/551149630188?text=Ol%C3%A1%20vim%20dos%20an%C3%BAncios%20e%20quero%20fazer%20uma%20cota%C3%A7%C3%A3o';

document.querySelectorAll('.lead-form').forEach((form) => {
  const statusMessage = form.querySelector('.form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.firstChild.textContent = 'Enviando... ';
    statusMessage.className = 'form-status';
    statusMessage.textContent = '';

    try {
      await fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'generate_lead', form_id: form.id, tipo_projeto: form.tipo.value || '' });
      form.reset();
      statusMessage.className = 'form-status success';
      statusMessage.textContent = 'Cadastro enviado. Nossa equipe entrará em contato.';
    } catch (error) {
      statusMessage.className = 'form-status error';
      statusMessage.innerHTML = `Não foi possível enviar agora. <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">Fale pelo WhatsApp</a>.`;
    } finally {
      button.disabled = false;
      button.firstChild.textContent = 'Solicitar cotação ';
    }
  });
});

const modal = document.querySelector('#lead-modal');

if (modal && typeof modal.showModal === 'function') {
  const closeModal = () => modal.close();

  document.querySelectorAll('[data-open-lead]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      modal.querySelector('.form-status').textContent = '';
      modal.showModal();
      document.body.classList.add('modal-open');
      modal.querySelector('input[name="nome"]').focus();
    });
  });

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
}
