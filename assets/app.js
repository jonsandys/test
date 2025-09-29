import { customers as seedCustomers, artworks as seedArtworks } from '../data/mockData.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US');

let customerData = seedCustomers.map((customer) => ({
  ...customer,
  interests: [...customer.interests],
  tags: [...customer.tags],
  favoriteArtists: [...customer.favoriteArtists],
  preferredMediums: [...customer.preferredMediums],
  sales: customer.sales ? customer.sales.map((sale) => ({ ...sale })) : [],
}));

let artworkData = seedArtworks.map((artwork) => ({
  ...artwork,
  keywords: [...artwork.keywords],
  imageUrl: artwork.imageUrl || '',
}));

const state = {
  customerSearch: '',
  customerStatus: 'all',
  customerTag: 'all',
  artworkSearch: '',
  artworkAvailability: 'all',
  artworkMedium: 'all',
  selectedCustomerId: null,
  selectedArtworkId: null,
};

const formState = {
  type: null,
  mode: null,
  id: null,
};

const el = {
  customerCount: document.querySelector('#customer-count'),
  artworkCount: document.querySelector('#artwork-count'),
  topMedium: document.querySelector('#top-medium'),
  topInterest: document.querySelector('#top-interest'),
  customerTable: document.querySelector('#customer-table tbody'),
  artworkTable: document.querySelector('#artwork-table tbody'),
  customerDetail: document.querySelector('#customer-detail'),
  artworkDetail: document.querySelector('#artwork-detail'),
  toggles: document.querySelectorAll('.toggle'),
  panels: document.querySelectorAll('.panel'),
  customerSearch: document.querySelector('#customer-search'),
  customerStatus: document.querySelector('#customer-status'),
  customerTag: document.querySelector('#customer-tag'),
  artworkSearch: document.querySelector('#artwork-search'),
  artworkAvailability: document.querySelector('#artwork-availability'),
  artworkMedium: document.querySelector('#artwork-medium'),
  addCustomer: document.querySelector('#add-customer'),
  addArtwork: document.querySelector('#add-artwork'),
  formDialog: document.querySelector('#form-dialog'),
  entityForm: document.querySelector('#entity-form'),
  formTitle: document.querySelector('#form-title'),
  formSubtitle: document.querySelector('#form-subtitle'),
  formFields: document.querySelector('#form-fields'),
  formClose: document.querySelector('#form-dialog [data-action="close"]'),
  formCancel: document.querySelector('#entity-form [data-action="cancel"]'),
};

const customerFormConfig = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'status', label: 'Status', type: 'text', defaultValue: 'Prospect' },
  { name: 'lastContacted', label: 'Last Contacted', type: 'date' },
  { name: 'preferredContact', label: 'Preferred Contact', type: 'text', defaultValue: 'Email' },
  {
    name: 'totalSpend',
    label: 'Total Spend (USD)',
    type: 'number',
    step: '1',
    min: '0',
    defaultValue: '0',
    getValue: (customer) => customer.totalSpend ?? 0,
  },
  {
    name: 'interests',
    label: 'Interests',
    type: 'text',
    placeholder: 'Comma separated',
    getValue: (customer) => customer.interests.join(', '),
  },
  {
    name: 'favoriteArtists',
    label: 'Favorite Artists',
    type: 'text',
    placeholder: 'Comma separated',
    getValue: (customer) => customer.favoriteArtists.join(', '),
  },
  {
    name: 'preferredMediums',
    label: 'Preferred Mediums',
    type: 'text',
    placeholder: 'Comma separated',
    getValue: (customer) => customer.preferredMediums.join(', '),
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'text',
    placeholder: 'Comma separated',
    getValue: (customer) => customer.tags.join(', '),
  },
];

const artworkFormConfig = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'artist', label: 'Artist', type: 'text', required: true },
  { name: 'year', label: 'Year', type: 'number', step: '1', min: '0', required: true },
  { name: 'medium', label: 'Medium', type: 'text', required: true },
  { name: 'price', label: 'Price (USD)', type: 'number', step: '1', min: '0', required: true },
  { name: 'dimensions', label: 'Dimensions', type: 'text' },
  {
    name: 'keywords',
    label: 'Keywords',
    type: 'text',
    placeholder: 'Comma separated',
    getValue: (artwork) => artwork.keywords.join(', '),
  },
  { name: 'location', label: 'Location', type: 'text', required: true },
  { name: 'availability', label: 'Availability', type: 'text', required: true, defaultValue: 'Available' },
  { name: 'imageUrl', label: 'Image URL', type: 'url', placeholder: 'https://example.com/artwork.jpg' },
];

function computeTopItem(collection, extractor) {
  const counts = new Map();
  collection.forEach((item) => {
    const values = extractor(item).filter(Boolean);
    values.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });
  let top = null;
  let max = 0;
  counts.forEach((count, key) => {
    if (count > max) {
      max = count;
      top = key;
    }
  });
  return top ? `${top} (${max})` : '—';
}

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function escapeAvailability(value) {
  return value.replace(/\s+/g, '\\ ');
}

function refreshFilters() {
  const fillSelect = (select, values, stateKey) => {
    const currentValue = state[stateKey];
    select.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All';
    select.append(allOption);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    if (currentValue !== 'all' && !values.includes(currentValue)) {
      state[stateKey] = 'all';
    }
    select.value = state[stateKey];
  };

  const statuses = Array.from(new Set(customerData.map((c) => c.status).filter(Boolean))).sort();
  fillSelect(el.customerStatus, statuses, 'customerStatus');

  const tagSet = new Set();
  customerData.forEach((customer) => customer.tags.forEach((tag) => tagSet.add(tag)));
  fillSelect(el.customerTag, Array.from(tagSet).filter(Boolean).sort(), 'customerTag');

  const availabilityOptions = Array.from(new Set(artworkData.map((a) => a.availability).filter(Boolean))).sort();
  fillSelect(el.artworkAvailability, availabilityOptions, 'artworkAvailability');

  const mediums = Array.from(new Set(artworkData.map((a) => a.medium).filter(Boolean))).sort();
  fillSelect(el.artworkMedium, mediums, 'artworkMedium');
}

function filterCustomers() {
  const search = state.customerSearch.toLowerCase();
  return customerData
    .filter((customer) => {
      if (state.customerStatus !== 'all' && customer.status !== state.customerStatus) {
        return false;
      }
      if (state.customerTag !== 'all' && !customer.tags.includes(state.customerTag)) {
        return false;
      }
      if (!search) {
        return true;
      }
      const haystack = [
        customer.name,
        customer.email,
        customer.phone,
        customer.city,
        customer.state,
        customer.country,
        customer.status,
        customer.preferredContact,
        ...customer.interests,
        ...customer.tags,
        ...customer.favoriteArtists,
        ...customer.preferredMediums,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function filterArtworks() {
  const search = state.artworkSearch.toLowerCase();
  return artworkData
    .filter((artwork) => {
      if (state.artworkAvailability !== 'all' && artwork.availability !== state.artworkAvailability) {
        return false;
      }
      if (state.artworkMedium !== 'all' && artwork.medium !== state.artworkMedium) {
        return false;
      }
      if (!search) {
        return true;
      }
      const haystack = [
        artwork.title,
        artwork.artist,
        artwork.medium,
        artwork.location,
        artwork.availability,
        ...artwork.keywords,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function renderCustomers() {
  const filtered = filterCustomers();
  el.customerTable.innerHTML = '';
  filtered.forEach((customer) => {
    const row = document.createElement('tr');
    row.dataset.id = customer.id;
    if (state.selectedCustomerId === customer.id) {
      row.classList.add('selected');
    }
    const salesCount = customer.sales.length;
    row.innerHTML = `
      <td>
        <div>${customer.name}</div>
        <div class="badge status-${customer.status}">${customer.status}</div>
      </td>
      <td>
        <div>${customer.email || '—'}</div>
        <div>${customer.phone || '—'}</div>
      </td>
      <td>${[customer.city, customer.state].filter(Boolean).join(', ') || customer.country || '—'}</td>
      <td>${customer.interests.join(', ') || '—'}</td>
      <td>${customer.tags.join(', ') || '—'}</td>
      <td>${customer.lastContacted || '—'}</td>
      <td>${currencyFormatter.format(customer.totalSpend || 0)}</td>
      <td>${salesCount ? `${salesCount} sale${salesCount === 1 ? '' : 's'}` : '—'}</td>
    `;
    row.addEventListener('click', () => selectCustomer(customer.id));
    el.customerTable.append(row);
  });
  if (!filtered.length) {
    renderCustomerDetail(null);
  }
}

function renderArtworks() {
  const filtered = filterArtworks();
  el.artworkTable.innerHTML = '';
  filtered.forEach((artwork) => {
    const row = document.createElement('tr');
    row.dataset.id = artwork.id;
    if (state.selectedArtworkId === artwork.id) {
      row.classList.add('selected');
    }
    row.innerHTML = `
      <td>${artwork.title}</td>
      <td>${artwork.artist}</td>
      <td>${artwork.year ?? '—'}</td>
      <td>${artwork.medium}</td>
      <td>${currencyFormatter.format(artwork.price || 0)}</td>
      <td>${artwork.location || '—'}</td>
      <td>${artwork.keywords.join(', ') || '—'}</td>
      <td><span class="badge availability-${escapeAvailability(artwork.availability)}">${artwork.availability}</span></td>
    `;
    row.addEventListener('click', () => selectArtwork(artwork.id));
    el.artworkTable.append(row);
  });
  if (!filtered.length) {
    renderArtworkDetail(null);
  }
}

function renderCustomerDetail(customer) {
  if (!customer) {
    el.customerDetail.innerHTML = `
      <div class="detail-header">
        <div>
          <h3>Customer Details</h3>
          <p>Select a customer to view their profile and sales notes.</p>
        </div>
        <div class="detail-actions" hidden>
          <button class="pill-button subtle" type="button" data-edit="customer">Edit</button>
          <button class="pill-button danger" type="button" data-delete="customer">Delete</button>
        </div>
      </div>
    `;
    return;
  }

  const salesList = customer.sales
    .map(
      (sale) => `
        <li>
          <strong>${sale.purchaseDate}</strong> — ${sale.artworkTitle} (${sale.artworkId})<br />
          <span>${currencyFormatter.format(sale.price)}</span> · <em>${sale.notes}</em>
        </li>
      `,
    )
    .join('');

  el.customerDetail.innerHTML = `
    <div class="detail-header">
      <div>
        <h3>${customer.name}</h3>
        <span class="badge status-${customer.status}">${customer.status}</span>
      </div>
      <div class="detail-actions">
        <button class="pill-button subtle" type="button" data-edit="customer">Edit</button>
        <button class="pill-button danger" type="button" data-delete="customer">Delete</button>
      </div>
    </div>
    <p class="muted">ID ${customer.id}${customer.lastContacted ? ` · Last contacted ${customer.lastContacted}` : ''}</p>
    <div class="meta-grid">
      <span><strong>Contact</strong>${customer.email || '—'}<br />${customer.phone || '—'}</span>
      <span><strong>Location</strong>${[customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '—'}</span>
      <span><strong>Preferred Contact</strong>${customer.preferredContact || '—'}</span>
      <span><strong>Total Spend</strong>${currencyFormatter.format(customer.totalSpend || 0)}</span>
    </div>
    <h4>Interests &amp; Preferences</h4>
    <ul>
      <li>Interests: ${customer.interests.join(', ') || '—'}</li>
      <li>Favorite Artists: ${customer.favoriteArtists.join(', ') || '—'}</li>
      <li>Preferred Mediums: ${customer.preferredMediums.join(', ') || '—'}</li>
      <li>Tags: ${customer.tags.join(', ') || '—'}</li>
    </ul>
    <h4>Recent Sales (${customer.sales.length})</h4>
    ${salesList ? `<ul>${salesList}</ul>` : '<p class="muted">No purchases recorded yet.</p>'}
  `;
}

function renderArtworkDetail(artwork) {
  if (!artwork) {
    el.artworkDetail.innerHTML = `
      <div class="detail-header">
        <div>
          <h3>Artwork Details</h3>
          <p>Select an artwork to view extended metadata and collector interest.</p>
        </div>
        <div class="detail-actions" hidden>
          <button class="pill-button subtle" type="button" data-edit="artwork">Edit</button>
          <button class="pill-button danger" type="button" data-delete="artwork">Delete</button>
        </div>
      </div>
    `;
    return;
  }

  const keywordsList = artwork.keywords.map((keyword) => `<span class="badge">${keyword}</span>`).join(' ');
  const interestedNames = findInterestedCustomers(artwork);

  el.artworkDetail.innerHTML = `
    <div class="detail-header">
      <div>
        <h3>${artwork.title}</h3>
        <span class="badge availability-${escapeAvailability(artwork.availability)}">${artwork.availability}</span>
      </div>
      <div class="detail-actions">
        <button class="pill-button subtle" type="button" data-edit="artwork">Edit</button>
        <button class="pill-button danger" type="button" data-delete="artwork">Delete</button>
      </div>
    </div>
    ${
      artwork.imageUrl
        ? `<img src="${artwork.imageUrl}" alt="${artwork.title}" />`
        : '<div class="image-placeholder">No image provided for this artwork.</div>'
    }
    <p class="muted">ID ${artwork.id} · ${artwork.year ?? 'Year unknown'}</p>
    <div class="meta-grid">
      <span><strong>Artist</strong>${artwork.artist}</span>
      <span><strong>Medium</strong>${artwork.medium}</span>
      <span><strong>Dimensions</strong>${artwork.dimensions || '—'}</span>
      <span><strong>Price</strong>${currencyFormatter.format(artwork.price || 0)}</span>
      <span><strong>Location</strong>${artwork.location || '—'}</span>
      <span><strong>Status</strong>${artwork.availability}</span>
    </div>
    <h4>Keywords</h4>
    ${keywordsList || '<p class="muted">No keywords provided.</p>'}
    <h4>Potential Collectors</h4>
    ${
      interestedNames.length
        ? `<ul>${interestedNames.map((name) => `<li>${name}</li>`).join('')}</ul>`
        : '<p class="muted">No matches yet.</p>'
    }
  `;
}

function attachCustomerDetailActions(customer) {
  const editButton = el.customerDetail.querySelector('[data-edit="customer"]');
  const deleteButton = el.customerDetail.querySelector('[data-delete="customer"]');
  if (editButton) {
    editButton.addEventListener('click', () => openEntityForm('customer', 'edit', customer.id));
  }
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      const confirmDelete = window.confirm(`Delete ${customer.name}? This action cannot be undone.`);
      if (confirmDelete) {
        deleteCustomer(customer.id);
      }
    });
  }
}

function attachArtworkDetailActions(artwork) {
  const editButton = el.artworkDetail.querySelector('[data-edit="artwork"]');
  const deleteButton = el.artworkDetail.querySelector('[data-delete="artwork"]');
  if (editButton) {
    editButton.addEventListener('click', () => openEntityForm('artwork', 'edit', artwork.id));
  }
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      const confirmDelete = window.confirm(`Delete ${artwork.title}? This action cannot be undone.`);
      if (confirmDelete) {
        deleteArtwork(artwork.id);
      }
    });
  }
}

function selectCustomer(id, { rerenderTable = true } = {}) {
  state.selectedCustomerId = id;
  if (rerenderTable) {
    renderCustomers();
  }
  const customer = customerData.find((c) => c.id === id);
  if (!customer) {
    renderCustomerDetail(null);
    return;
  }
  renderCustomerDetail(customer);
  attachCustomerDetailActions(customer);
}

function selectArtwork(id, { rerenderTable = true } = {}) {
  state.selectedArtworkId = id;
  if (rerenderTable) {
    renderArtworks();
  }
  const artwork = artworkData.find((a) => a.id === id);
  if (!artwork) {
    renderArtworkDetail(null);
    return;
  }
  renderArtworkDetail(artwork);
  attachArtworkDetailActions(artwork);
}

function findInterestedCustomers(artwork) {
  const interested = customerData.filter(
    (customer) =>
      customer.favoriteArtists.includes(artwork.artist) || customer.preferredMediums.includes(artwork.medium),
  );
  return interested.slice(0, 5).map((customer) => customer.name);
}

function openEntityForm(type, mode, entityId = null) {
  formState.type = type;
  formState.mode = mode;
  formState.id = entityId;

  const isCustomer = type === 'customer';
  const entity =
    mode === 'edit'
      ? (isCustomer ? customerData.find((item) => item.id === entityId) : artworkData.find((item) => item.id === entityId))
      : null;

  el.formTitle.textContent = mode === 'edit' ? `Edit ${isCustomer ? 'Customer' : 'Artwork'}` : `Add ${
    isCustomer ? 'Customer' : 'Artwork'
  }`;
  el.formSubtitle.textContent =
    mode === 'edit'
      ? `Update details for ${isCustomer ? entity?.name ?? '' : entity?.title ?? ''}.`
      : `Create a new ${isCustomer ? 'customer profile' : 'artwork record'}.`;

  el.entityForm.reset();
  el.formFields.innerHTML = '';

  const fields = isCustomer ? customerFormConfig : artworkFormConfig;
  fields.forEach((field) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'form-field';
    wrapper.setAttribute('for', field.name);

    const label = document.createElement('span');
    label.textContent = field.label;
    wrapper.append(label);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = field.type;
    }

    input.id = field.name;
    input.name = field.name;

    if (field.required) {
      input.required = true;
    }
    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }
    if (field.step) {
      input.step = field.step;
    }
    if (field.min !== undefined) {
      input.min = field.min;
    }
    if (field.autocomplete) {
      input.autocomplete = field.autocomplete;
    }

    let value = '';
    if (entity && typeof field.getValue === 'function') {
      value = field.getValue(entity);
    } else if (entity && field.name in entity) {
      value = entity[field.name] ?? '';
    } else if (field.defaultValue !== undefined) {
      value = field.defaultValue;
    }

    if (value === null || value === undefined) {
      value = '';
    }

    input.value = value;
    wrapper.append(input);
    el.formFields.append(wrapper);
  });

  el.formDialog.showModal();
}

function closeFormDialog() {
  if (el.formDialog.open) {
    el.formDialog.close();
  }
  el.entityForm.reset();
  el.formFields.innerHTML = '';
  formState.type = null;
  formState.mode = null;
  formState.id = null;
}

function handleFormSubmit(event) {
  event.preventDefault();
  if (!formState.type) {
    return;
  }

  const formData = new FormData(el.entityForm);
  const getValue = (name) => (formData.get(name) ?? '').toString().trim();

  if (formState.type === 'customer') {
    const existing = formState.mode === 'edit' ? customerData.find((c) => c.id === formState.id) : null;
    const payload = {
      id: formState.mode === 'edit' && existing ? existing.id : generateCustomerId(),
      name: getValue('name'),
      email: getValue('email'),
      phone: getValue('phone'),
      city: getValue('city'),
      state: getValue('state'),
      country: getValue('country'),
      status: getValue('status') || 'Prospect',
      lastContacted: getValue('lastContacted'),
      preferredContact: getValue('preferredContact') || 'Email',
      totalSpend: Number(formData.get('totalSpend') || 0),
      interests: splitList(getValue('interests')),
      favoriteArtists: splitList(getValue('favoriteArtists')),
      preferredMediums: splitList(getValue('preferredMediums')),
      tags: splitList(getValue('tags')),
      sales: existing ? existing.sales.map((sale) => ({ ...sale })) : [],
    };

    if (formState.mode === 'edit' && existing) {
      const index = customerData.findIndex((customer) => customer.id === existing.id);
      customerData[index] = payload;
    } else {
      customerData.push(payload);
    }

    closeFormDialog();
    onCustomerDataChange(payload.id);
    return;
  }

  const existingArtwork = formState.mode === 'edit' ? artworkData.find((art) => art.id === formState.id) : null;
  const yearValue = getValue('year');
  const priceValue = getValue('price');
  const payload = {
    id: formState.mode === 'edit' && existingArtwork ? existingArtwork.id : generateArtworkId(),
    title: getValue('title'),
    artist: getValue('artist'),
    year: yearValue ? Number(yearValue) : null,
    medium: getValue('medium'),
    price: priceValue ? Number(priceValue) : 0,
    dimensions: getValue('dimensions'),
    keywords: splitList(getValue('keywords')),
    location: getValue('location'),
    availability: getValue('availability') || 'Available',
    imageUrl: getValue('imageUrl'),
  };

  if (formState.mode === 'edit' && existingArtwork) {
    const index = artworkData.findIndex((art) => art.id === existingArtwork.id);
    artworkData[index] = payload;
  } else {
    artworkData.push(payload);
  }

  closeFormDialog();
  onArtworkDataChange(payload.id);
}

function deleteCustomer(id) {
  const index = customerData.findIndex((customer) => customer.id === id);
  if (index === -1) {
    return;
  }
  customerData.splice(index, 1);
  onCustomerDataChange();
}

function deleteArtwork(id) {
  const index = artworkData.findIndex((artwork) => artwork.id === id);
  if (index === -1) {
    return;
  }
  artworkData.splice(index, 1);
  onArtworkDataChange();
}

function generateCustomerId() {
  const maxId = customerData.reduce((max, customer) => {
    const value = Number(customer.id.replace(/\D/g, ''));
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return `C${String(maxId + 1).padStart(3, '0')}`;
}

function generateArtworkId() {
  const maxId = artworkData.reduce((max, artwork) => {
    const value = Number(artwork.id.replace(/\D/g, ''));
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return `A${String(maxId + 1).padStart(3, '0')}`;
}

function onCustomerDataChange(preferredId) {
  const fallbackId = preferredId ?? state.selectedCustomerId;
  const hasFallback = fallbackId && customerData.some((customer) => customer.id === fallbackId);
  const idToSelect = hasFallback ? fallbackId : customerData[0]?.id ?? null;
  state.selectedCustomerId = idToSelect;
  refreshFilters();
  updateSummary();
  renderCustomers();
  if (idToSelect) {
    selectCustomer(idToSelect, { rerenderTable: false });
  } else {
    renderCustomerDetail(null);
  }
}

function onArtworkDataChange(preferredId) {
  const fallbackId = preferredId ?? state.selectedArtworkId;
  const hasFallback = fallbackId && artworkData.some((art) => art.id === fallbackId);
  const idToSelect = hasFallback ? fallbackId : artworkData[0]?.id ?? null;
  state.selectedArtworkId = idToSelect;
  refreshFilters();
  updateSummary();
  renderArtworks();
  if (idToSelect) {
    selectArtwork(idToSelect, { rerenderTable: false });
  } else {
    renderArtworkDetail(null);
  }
}

function updateSummary() {
  el.customerCount.textContent = numberFormatter.format(customerData.length);
  el.artworkCount.textContent = numberFormatter.format(artworkData.length);
  el.topMedium.textContent = computeTopItem(artworkData, (artwork) => [artwork.medium]);
  el.topInterest.textContent = computeTopItem(customerData, (customer) => customer.interests);
}

function bindEvents() {
  el.customerSearch.addEventListener('input', (event) => {
    state.customerSearch = event.target.value;
    renderCustomers();
  });
  el.customerStatus.addEventListener('change', (event) => {
    state.customerStatus = event.target.value;
    renderCustomers();
  });
  el.customerTag.addEventListener('change', (event) => {
    state.customerTag = event.target.value;
    renderCustomers();
  });

  el.artworkSearch.addEventListener('input', (event) => {
    state.artworkSearch = event.target.value;
    renderArtworks();
  });
  el.artworkAvailability.addEventListener('change', (event) => {
    state.artworkAvailability = event.target.value;
    renderArtworks();
  });
  el.artworkMedium.addEventListener('change', (event) => {
    state.artworkMedium = event.target.value;
    renderArtworks();
  });

  el.toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      el.toggles.forEach((btn) => btn.classList.toggle('active', btn === button));
      el.panels.forEach((panel) => panel.classList.toggle('active', panel.id === target));
    });
  });

  el.addCustomer.addEventListener('click', () => openEntityForm('customer', 'create'));
  el.addArtwork.addEventListener('click', () => openEntityForm('artwork', 'create'));

  el.entityForm.addEventListener('submit', handleFormSubmit);

  el.formCancel.addEventListener('click', () => {
    closeFormDialog();
  });
  el.formClose.addEventListener('click', () => {
    closeFormDialog();
  });
  el.formDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeFormDialog();
  });
}

function init() {
  state.selectedCustomerId = customerData[0]?.id ?? null;
  state.selectedArtworkId = artworkData[0]?.id ?? null;

  refreshFilters();
  bindEvents();
  updateSummary();
  renderCustomers();
  renderArtworks();

  if (state.selectedCustomerId) {
    selectCustomer(state.selectedCustomerId, { rerenderTable: false });
  } else {
    renderCustomerDetail(null);
  }

  if (state.selectedArtworkId) {
    selectArtwork(state.selectedArtworkId, { rerenderTable: false });
  } else {
    renderArtworkDetail(null);
  }

  el.toggles.forEach((btn) => {
    if (btn.dataset.target === 'customers') {
      btn.classList.add('active');
    }
  });
}

init();
