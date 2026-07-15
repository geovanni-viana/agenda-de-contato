/**
 * app.js — Agenda de Contatos
 * App simples: cadastro (nome, telefone, e-mail), pesquisa, edição e exclusão.
 * Persistência via LocalStorage. Sem frameworks, sem dependências externas.
 */

(() => {
  const STORAGE_KEY = 'agenda:contacts';

  // ---------- Elementos ----------
  const form = document.getElementById('contact-form');
  const idInput = document.getElementById('contact-id');
  const nameInput = document.getElementById('name-input');
  const phoneInput = document.getElementById('phone-input');
  const emailInput = document.getElementById('email-input');
  const formError = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const searchInput = document.getElementById('search-input');
  const list = document.getElementById('contact-list');
  const emptyState = document.getElementById('empty-state');
  const contactCount = document.getElementById('contact-count');
  const toast = document.getElementById('toast');

  let contacts = [];
  let searchTerm = '';
  let toastTimer = null;

  // ---------- Persistência ----------
  function loadContacts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      contacts = raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Não foi possível ler os contatos salvos.', err);
      contacts = [];
    }
  }

  function saveContacts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (err) {
      console.error('Não foi possível salvar os contatos.', err);
      showToast('Erro ao salvar. Verifique o armazenamento do navegador.');
    }
  }

  // ---------- Utilitários ----------
  function normalize(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function generateId() {
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  // ---------- Validação ----------
  function validate({ name, phone, email }, ignoreId) {
    if (!name.trim()) return 'Informe o nome do contato.';
    if (!phone.trim()) return 'Informe o telefone do contato.';
    if (email.trim() && !isValidEmail(email.trim())) return 'Informe um e-mail válido.';

    const duplicate = contacts.some(
      (c) => c.id !== ignoreId && normalize(c.name) === normalize(name) && c.phone === phone.trim()
    );
    if (duplicate) return 'Já existe um contato com esse nome e telefone.';

    return null;
  }

  // ---------- Formulário: adicionar / editar ----------
  function resetForm() {
    idInput.value = '';
    nameInput.value = '';
    phoneInput.value = '';
    emailInput.value = '';
    formError.textContent = '';
    submitBtn.textContent = 'Adicionar contato';
    cancelEditBtn.hidden = true;
  }

  function startEdit(contact) {
    idInput.value = contact.id;
    nameInput.value = contact.name;
    phoneInput.value = contact.phone;
    emailInput.value = contact.email || '';
    formError.textContent = '';
    submitBtn.textContent = 'Salvar alterações';
    cancelEditBtn.hidden = false;
    nameInput.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const data = {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
    };

    const editingId = idInput.value || null;
    const error = validate(data, editingId);
    if (error) {
      formError.textContent = error;
      return;
    }
    formError.textContent = '';

    if (editingId) {
      const contact = contacts.find((c) => c.id === editingId);
      if (contact) {
        contact.name = data.name;
        contact.phone = data.phone;
        contact.email = data.email;
      }
      showToast('Contato atualizado.');
    } else {
      contacts.unshift({ id: generateId(), ...data });
      showToast('Contato adicionado.');
    }

    saveContacts();
    resetForm();
    render();
  }

  // ---------- Excluir ----------
  function handleDelete(id) {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    const confirmed = window.confirm(`Excluir o contato "${contact.name}"?`);
    if (!confirmed) return;

    contacts = contacts.filter((c) => c.id !== id);
    saveContacts();

    // Se o contato excluído estava sendo editado, limpa o formulário.
    if (idInput.value === id) resetForm();

    showToast('Contato removido.');
    render();
  }

  // ---------- Renderização ----------
  function buildContactItem(contact) {
    const li = document.createElement('li');
    li.className = 'contact';

    const avatar = document.createElement('div');
    avatar.className = 'contact__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = getInitials(contact.name) || '?';

    const info = document.createElement('div');
    info.className = 'contact__info';

    const nameEl = document.createElement('p');
    nameEl.className = 'contact__name';
    nameEl.textContent = contact.name;

    const phoneEl = document.createElement('p');
    phoneEl.className = 'contact__detail';
    phoneEl.textContent = contact.phone;

    info.appendChild(nameEl);
    info.appendChild(phoneEl);

    if (contact.email) {
      const emailEl = document.createElement('p');
      emailEl.className = 'contact__detail';
      emailEl.textContent = contact.email;
      info.appendChild(emailEl);
    }

    const actions = document.createElement('div');
    actions.className = 'contact__actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'contact__action-btn';
    editBtn.textContent = 'Editar';
    editBtn.setAttribute('aria-label', `Editar ${contact.name}`);
    editBtn.addEventListener('click', () => startEdit(contact));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'contact__action-btn contact__action-btn--danger';
    deleteBtn.textContent = 'Excluir';
    deleteBtn.setAttribute('aria-label', `Excluir ${contact.name}`);
    deleteBtn.addEventListener('click', () => handleDelete(contact.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(avatar);
    li.appendChild(info);
    li.appendChild(actions);

    return li;
  }

  function getVisibleContacts() {
    const term = normalize(searchTerm);
    let visible = contacts;

    if (term) {
      visible = contacts.filter(
        (c) =>
          normalize(c.name).includes(term) ||
          normalize(c.phone).includes(term) ||
          normalize(c.email || '').includes(term)
      );
    }

    return [...visible].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  function render() {
    const visible = getVisibleContacts();
    list.replaceChildren();

    if (visible.length === 0) {
      emptyState.hidden = false;
      emptyState.textContent = searchTerm
        ? 'Nenhum contato encontrado para essa pesquisa.'
        : 'Nenhum contato cadastrado ainda. Adicione o primeiro acima.';
    } else {
      emptyState.hidden = true;
      const fragment = document.createDocumentFragment();
      visible.forEach((c) => fragment.appendChild(buildContactItem(c)));
      list.appendChild(fragment);
    }

    contactCount.textContent = `${contacts.length} ${contacts.length === 1 ? 'contato' : 'contatos'}`;
  }

  // ---------- Eventos ----------
  form.addEventListener('submit', handleSubmit);
  cancelEditBtn.addEventListener('click', resetForm);
  searchInput.addEventListener('input', (event) => {
    searchTerm = event.target.value;
    render();
  });

  // ---------- Início ----------
  loadContacts();
  render();
})();
