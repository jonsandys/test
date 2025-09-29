import { customers, artworks } from '../data/mockData.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US');

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
};

function computeTopItem(collection, extractor) {
  const counts = new Map();
  collection.forEach((item) => {
    extractor(item).forEach((value) => {
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

function populateFilters() {
  const statuses = Array.from(new Set(customers.map((c) => c.status))).sort();
  statuses.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    el.customerStatus.append(option);
  });

  const tags = new Set();
  customers.forEach((customer) => customer.tags.forEach((tag) => tags.add(tag)));
  Array.from(tags)
    .sort()
    .forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      el.customerTag.append(option);
    });

  const availabilityOptions = Array.from(new Set(artworks.map((a) => a.availability))).sort();
  availabilityOptions.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    el.artworkAvailability.append(option);
  });

  const mediums = Array.from(new Set(artworks.map((a) => a.medium))).sort();
  mediums.forEach((medium) => {
    const option = document.createElement('option');
    option.value = medium;
    option.textContent = medium;
    el.artworkMedium.append(option);
  });
}

function filterCustomers() {
  const search = state.customerSearch.toLowerCase();
  return customers
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
  return artworks
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
        <div>${customer.email}</div>
        <div>${customer.phone}</div>
      </td>
      <td>${customer.city}, ${customer.state}</td>
      <td>${customer.interests.join(', ')}</td>
      <td>${customer.tags.join(', ')}</td>
      <td>${customer.lastContacted}</td>
      <td>${currencyFormatter.format(customer.totalSpend)}</td>
      <td>${salesCount ? `${salesCount} sale${salesCount === 1 ? '' : 's'}` : '—'}</td>
    `;
    row.addEventListener('click', () => selectCustomer(customer.id));
    el.customerTable.append(row);
  });
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
      <td>${artwork.year}</td>
      <td>${artwork.medium}</td>
      <td>${currencyFormatter.format(artwork.price)}</td>
      <td>${artwork.location}</td>
      <td>${artwork.keywords.join(', ')}</td>
      <td><span class="badge availability-${artwork.availability.replace(' ', '\\ ')}">${artwork.availability}</span></td>
    `;
    row.addEventListener('click', () => selectArtwork(artwork.id));
    el.artworkTable.append(row);
  });
}

function selectCustomer(id) {
  state.selectedCustomerId = id;
  renderCustomers();
  const customer = customers.find((c) => c.id === id);
  if (!customer) {
    el.customerDetail.innerHTML = '<p>Select a customer to view their profile and sales notes.</p>';
    return;
  }
  const interestedMediums = customer.preferredMediums.join(', ');
  const artistList = customer.favoriteArtists.join(', ');
  const sales = customer.sales
    .map(
      (sale) => `<li><strong>${sale.purchaseDate}</strong> — ${sale.artworkTitle} (${sale.artworkId})<br /><span>${currencyFormatter.format(
        sale.price,
      )}</span> · <em>${sale.notes}</em></li>`,
    )
    .join('');
  el.customerDetail.innerHTML = `
    <h3>${customer.name}</h3>
    <span class="badge status-${customer.status}">${customer.status}</span>
    <div class="meta-grid">
      <span><strong>Contact</strong>${customer.email}<br />${customer.phone}</span>
      <span><strong>Location</strong>${customer.city}, ${customer.state} · ${customer.country}</span>
      <span><strong>Preferred Contact</strong>${customer.preferredContact}</span>
      <span><strong>Total Spend</strong>${currencyFormatter.format(customer.totalSpend)}</span>
    </div>
    <h4>Interests &amp; Preferences</h4>
    <ul>
      <li>Interests: ${customer.interests.join(', ')}</li>
      <li>Favorite Artists: ${artistList}</li>
      <li>Preferred Mediums: ${interestedMediums}</li>
      <li>Tags: ${customer.tags.join(', ')}</li>
    </ul>
    <h4>Recent Sales (${customer.sales.length || '0'})</h4>
    ${sales ? `<ul>${sales}</ul>` : '<p>No purchases recorded yet.</p>'}
  `;
}

function findInterestedCustomers(artwork) {
  const interested = customers.filter(
    (customer) =>
      customer.favoriteArtists.includes(artwork.artist) || customer.preferredMediums.includes(artwork.medium),
  );
  return interested.slice(0, 5).map((customer) => customer.name);
}

function selectArtwork(id) {
  state.selectedArtworkId = id;
  renderArtworks();
  const artwork = artworks.find((a) => a.id === id);
  if (!artwork) {
    el.artworkDetail.innerHTML = '<p>Select an artwork to view extended metadata and collector interest.</p>';
    return;
  }
  const interestedNames = findInterestedCustomers(artwork);
  const keywordsList = artwork.keywords.map((keyword) => `<span class="badge">${keyword}</span>`).join(' ');
  el.artworkDetail.innerHTML = `
    <h3>${artwork.title}</h3>
    <span class="badge availability-${artwork.availability.replace(' ', '\\ ')}">${artwork.availability}</span>
    <div class="meta-grid">
      <span><strong>Artist</strong>${artwork.artist}</span>
      <span><strong>Medium</strong>${artwork.medium}</span>
      <span><strong>Year</strong>${artwork.year}</span>
      <span><strong>Dimensions</strong>${artwork.dimensions}</span>
      <span><strong>Price</strong>${currencyFormatter.format(artwork.price)}</span>
      <span><strong>Location</strong>${artwork.location}</span>
    </div>
    <h4>Keywords</h4>
    <p>${keywordsList}</p>
    <h4>Potential Collectors</h4>
    ${interestedNames.length ? `<ul>${interestedNames.map((name) => `<li>${name}</li>`).join('')}</ul>` : '<p>No matches yet.</p>'}
  `;
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
}

function updateSummary() {
  el.customerCount.textContent = numberFormatter.format(customers.length);
  el.artworkCount.textContent = numberFormatter.format(artworks.length);
  el.topMedium.textContent = computeTopItem(artworks, (artwork) => [artwork.medium]);
  el.topInterest.textContent = computeTopItem(customers, (customer) => customer.interests);
}

function init() {
  populateFilters();
  bindEvents();
  updateSummary();
  renderCustomers();
  renderArtworks();
  if (customers[0]) {
    selectCustomer(customers[0].id);
  }
  if (artworks[0]) {
    selectArtwork(artworks[0].id);
  }
  // Default active toggle
  el.toggles.forEach((btn) => {
    if (btn.dataset.target === 'customers') {
      btn.classList.add('active');
    }
  });
}

init();
