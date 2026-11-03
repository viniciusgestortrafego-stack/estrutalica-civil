const whatsappNumber = '5511941015207';

// Parâmetros de campanha, com os mesmos nomes de campo do site da Estrutálica Automotiva.
// Guarda no navegador a primeira visita que chegou com UTM ou ID de clique por 90 dias,
// para o lead manter a origem mesmo se voltar depois sem os parâmetros.
const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ad_id', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
const trackingStorageKey = 'estrutalica_tracking';
const trackingTtl = 90 * 24 * 60 * 60 * 1000;

const readTrackingFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const found = {};
  trackingKeys.forEach((key) => {
    const value = (params.get(key) || '').trim();
    // Parâmetro do Google sem valor chega escrito como "{_midia}": descarta.
    if (value && !/^\{.*\}$/.test(value)) found[key] = value;
  });
  return found;
};

const captureTracking = () => {
  const fromUrl = readTrackingFromUrl();
  const current = { ...fromUrl, landing_page: window.location.href, referrer: document.referrer };

  try {
    const saved = JSON.parse(localStorage.getItem(trackingStorageKey) || 'null');
    if (saved && saved.salvo_em && Date.now() - saved.salvo_em < trackingTtl) return saved;

    if (Object.keys(fromUrl).length) {
      const data = { ...current, salvo_em: Date.now() };
      localStorage.setItem(trackingStorageKey, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    // Sem acesso ao armazenamento do navegador: usa só o que veio na URL desta visita.
  }
  return current;
};

const tracking = captureTracking();

const trackingPayload = () => {
  const data = {};
  trackingKeys.forEach((key) => { data[key] = tracking[key] || ''; });
  data.landing_page = tracking.landing_page || window.location.href;
  data.referrer = tracking.referrer || '';
  return data;
};

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
    const payload = JSON.stringify({ ...Object.fromEntries(new FormData(form)), ...trackingPayload(), brand: 'estrutalica-civil' });
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
      const t = trackingPayload();
      window.dataLayer.push({
        event: 'generate_lead',
        form_id: form.id,
        tipo_projeto: form.tipo.value || '',
        utm_source: t.utm_source,
        utm_medium: t.utm_medium,
        utm_campaign: t.utm_campaign,
        utm_content: t.utm_content,
        utm_term: t.utm_term,
        ad_id: t.ad_id,
      });
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
