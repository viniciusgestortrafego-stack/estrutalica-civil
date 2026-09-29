const form = document.querySelector('#lead-form');
const statusMessage = document.querySelector('#form-status');

if (form) {
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
      window.dataLayer.push({ event: 'generate_lead', form_id: 'lead-form', tipo_projeto: form.tipo.value || '' });
      form.reset();
      statusMessage.className = 'form-status success';
      statusMessage.textContent = 'Cadastro enviado. Nossa equipe entrará em contato.';
    } catch (error) {
      statusMessage.className = 'form-status error';
      statusMessage.innerHTML = 'Não foi possível enviar agora. <a href="https://wa.me/551149630188?text=Ol%C3%A1%20vim%20dos%20an%C3%BAncios%20e%20quero%20fazer%20uma%20cota%C3%A7%C3%A3o" target="_blank" rel="noopener noreferrer">Fale pelo WhatsApp</a>.';
    } finally {
      button.disabled = false;
      button.firstChild.textContent = 'Solicitar cotação ';
    }
  });
}
