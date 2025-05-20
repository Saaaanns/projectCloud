"use strict";

import customersData from "../JSON/klanten.json" with { type: 'json' };
console.log(customersData.customers)

const data = document.querySelector('.customersData');

customersData.customers.forEach(customer => {
    const customerCard = document.createElement('div');
    customerCard.style.border = '1px solid gray';
    customerCard.style.padding = '16px';
    customerCard.style.margin = '10px';
    customerCard.style.borderRadius = '8px';
    customerCard.style.width = '165px';

    customerCard.innerHTML = `
    <img src="${customer.picture}" alt="${customer.name.first}" />
    <h3>${customer.name.title} ${customer.name.first} ${customer.name.last}</h3>
    <p>Land: ${customer.country}</p>`;

    data.appendChild(customerCard);
});