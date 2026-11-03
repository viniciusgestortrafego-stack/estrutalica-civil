const whatsappNumber = '5511941015207';

const leadWhatsappUrl = (nome, tipo) => {
  const primeiroNome = (nome || '').trim().split(/\s+/)[0];
  let mensagem = primeiroNome ? `Olá! Sou ${primeiroNome}, acabei de me cadastrar no site e quero fazer um orçamento` : 'Olá! Acabei de me cadastrar no site e quero fazer um orçamento';
  if (tipo) mensagem += ` de ${tipo.toLowerCase()}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`${mensagem}.`)}`;
};

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

    const leadUrl = leadWhatsappUrl(form.nome.value, form.tipo.value);
    const payload = JSON.stringify({ ...Object.fromEntries(new FormData(form)), brand: 'estrutalica-civil' });
    let enviado = true;

    try {
      // keepalive mantém o envio mesmo depois que a página vai para o WhatsApp;
      // o limite de 4 s evita que um servidor lento segure a pessoa aqui.
      await Promise.race([
        fetch(form.action, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload,
        }),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (error) {
      enviado = false;
    }

    if (enviado) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'generate_lead', form_id: form.id, tipo_projeto: form.tipo.value || '' });
      form.reset();
    }
    statusMessage.className = enviado ? 'form-status success' : 'form-status error';
    statusMessage.innerHTML = `${enviado ? 'Cadastro enviado!' : 'Não conseguimos registrar agora, mas você pode falar direto com a gente.'} Abrindo o WhatsApp… <a href="${leadUrl}">Clique aqui se não abrir</a>.`;
    setTimeout(() => { window.location.href = leadUrl; }, 800);
    button.disabled = false;
    button.firstChild.textContent = 'Solicitar cotação ';
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
