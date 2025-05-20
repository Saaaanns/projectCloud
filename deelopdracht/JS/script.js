"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const reviewForm = document.getElementById("reviewForm");
  const reviewsContainer = document.getElementById("reviews");
  const reviews = [];

  reviewForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const reviewText = document.getElementById("review").value;

    const newReview = {
      name: name,
      review: reviewText,
      date: new Date().toLocaleString(),
    };

    reviews.push(newReview);

    renderReviews(reviews);

    reviewForm.reset();
  });
  function renderReviews(reviews) {
    reviewsContainer.innerHTML = "";

    reviews.forEach(function (review) {
      const reviewElement = document.createElement("div");
      reviewElement.innerHTML = `
                <strong>${review.name}</strong> schreef op ${review.date}:<br>
                <em>${review.review}</em>
                <hr>
            `;
      reviewsContainer.appendChild(reviewElement);
    });
  }
});
