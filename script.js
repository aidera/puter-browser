/* --- ------------ --- */
/* --- Environments --- */
/* --- ------------ --- */
// Security risk
const GOOGLE_API_KEY = 'AIzaSyD2qMsM0jAvYTaIlTED8OfQWUvVq3ybZQM';
const GOOGLE_CX = '27a34dd02e0b14631';

/* --- ----- --- */
/* --- Utils --- */
/* --- ----- --- */
/**
 * Extracts an array from a string by removing newlines and parsing the JSON.
 * @param {string} str - The string to parse.
 * @returns {Array} - The parsed array or an empty array if parsing fails.
 */
function extractArrayFromString(str) {
  const clearStr = str.replace(/\n\s+/g, '');

  try {
    const array = JSON.parse(clearStr);
    return array;
  } catch (e) {
    console.error('Failed to parse the array:', e);
  }

  return [];
}

/**
 * Creates a debounced version of a function.
 * @param {Function} func - The original function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, delay) {
  let debounceTimer;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * Handles click events outside of specified elements.
 * @param {Array} elements - The elements to check for outside clicks.
 * @param {Event} event - The click event.
 * @param {Function} func - The function to execute on an outside click.
 */
function handleClickOutside(elements, event, func) {
  const isOutside = elements.every(
    (element) => !element.contains(event.target)
  );

  if (isOutside && func) {
    func();
  }
}

/* --- ----------------------------- --- */
/* --- Renderers and style modifiers --- */
/* --- ----------------------------- --- */

/**
 * Removes all children and event listeners from a parent element.
 * @param {HTMLElement} parentElement - The parent element to clear.
 * @param {string} eventType - The event type to remove.
 * @param {Function} func - The listener function to remove.
 */
function removeAllChildrenAndEvents(parentElement, eventType, func) {
  while (parentElement.firstChild) {
    const child = parentElement.firstChild;
    child.removeEventListener(eventType, func);
    parentElement.removeChild(child);
  }
  parentElement.innerHTML = '';
}

/**
 * Renders a list of search hints in the specified container.
 * @param {Array} items - The search hints to render.
 * @param {HTMLElement} container - The container to render the hints in.
 */
function renderSearchHintsList(items, container) {
  // Clear the container before rendering new items
  container.innerHTML = '';

  // Iterate over each item and create a list element
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    // Add a click event listener to navigate using the hint
    li.addEventListener('click', () => navigateByHintHandler(item));
    container.appendChild(li);
  });
}

/**
 * Renders a list of websites in the specified container.
 * @param {Array} items - The website items to render.
 * @param {HTMLElement} container - The container to render the websites in.
 */
function renderWebsiteList(items, container) {
  // Clear the container before rendering new items
  container.innerHTML = '';

  // Iterate over each item and create the necessary elements
  items.forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.setAttribute('target', '_blank');
    a.href = item.link;
    a.innerHTML = `
        <h3>${item.title}</h3>
        <span class='website'>${item.displayLink}</span>
        <p class='snippet'>${item.snippet}</p>
      `;
    li.appendChild(a);
    container.appendChild(li);
  });
}

/**
 * Toggles the display of the search hint list.
 * @param {boolean} status - Whether to show or hide the hint list.
 */
function displayHintList(status) {
  const output = document.getElementById('search-hint-output');
  if (status && output.children.length > 0) {
    output.style.display = 'block';
  } else {
    output.style.display = 'none';
  }
}

/**
 * Animates background objects based on mouse movement to create a parallax effect.
 * @param {MouseEvent} event - The mousemove event object containing clientX and clientY.
 */
function backgroundObjectsParallax(event) {
  const { clientX, clientY } = event;
  const backgroundObjects = document.querySelectorAll('#background-deco span');

  // Define an array with modifiers for each background object to control the intensity of the parallax effect
  const modifiers = [0.03, 0.05, 0.07, 0.1, 0.12];

  backgroundObjects.forEach((obj, index) => {
    const modifier = modifiers[index];
    const translateX = (clientX - window.innerWidth / 2) * modifier;
    const translateY = (clientY - window.innerHeight / 2) * modifier;
    obj.style.transform = `translate(${translateX}px, ${translateY}px)`;
  });
}

/* --- ------- --- */
/* --- Actions --- */
/* --- ------- --- */

/**
 * Handles navigation based on search hints.
 * @param {string} query - The search query.
 */
function navigateByHintHandler(query) {
  displayHintList(false);

  // Clear the previous results
  const input = document.getElementById('search-input');
  const websitesSection = document.getElementById('websites-section');
  const websitesList = document.getElementById('websites-list');
  input.value = query;
  websitesSection.style.display = 'none';

  if (!query) return;

  // Fetch search results from Google Custom Search API
  // THERE ARE LIMITS! 100 REQUESTS PER DAY
  // AND BETTER USE YOUR OWN KEYS AND IDS

  fetch(
    `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (!data || !data.items || !data.items.length) return;

      websitesSection.style.display = 'block';
      renderWebsiteList(data.items, websitesList);
    })
    .catch((error) => console.error('Error:', error));
}

/**
 * Clears the search input and hint list.
 */
function clear() {
  const input = document.getElementById('search-input');
  const output = document.getElementById('search-hint-output');

  input.value = '';
  removeAllChildrenAndEvents(output, 'click', navigateByHintHandler);
}

/**
 * Fetches and displays search hints based on user input.
 * @param {Event} event - The event object from the input field.
 * @param {HTMLElement} container - The container where search hints will be displayed.
 */
const getSearchHints = (event, container) => {
  // Call the chat API to get search suggestions
  puter.ai
    .chat(
      `
        Here is the phrase user enters: "${event.srcElement.value}". 
        Generate up to 5 search suggestions as if you were a browser, helping you find the information you need.
        Return the result in JavaScript array format without additional formatting.
    `
    )
    .then((response) => {
      // Remove all children and click events from the output container
      removeAllChildrenAndEvents(container, 'click', navigateByHintHandler);

      // Extract the array of hints from the response content
      const array = extractArrayFromString(response.message.content);

      // Render the list of search hints and display it
      renderSearchHintsList(array, container);

      // Make the hint list visible
      displayHintList(true);
    });
};

/* --- ----------- --- */
/* --- Composition --- */
/* --- ----------- --- */

document.addEventListener('DOMContentLoaded', async () => {
  /** Get DOM elements */
  const input = document.getElementById('search-input');
  const output = document.getElementById('search-hint-output');
  const clearButton = document.getElementById('search-actions__clear');
  const submitButton = document.getElementById('search-actions__submit');

  /** Actions */
  const debouncedGetSearchHints = debounce(
    (event) => getSearchHints(event, output),
    200
  );

  /** Assign event listeners */
  document.addEventListener('click', (event) =>
    handleClickOutside([input, output], event, () => displayHintList(false))
  );

  input.addEventListener('click', () => displayHintList(true));
  input.addEventListener('input', debouncedGetSearchHints);
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      displayHintList(false);
      navigateByHintHandler(event.srcElement.value);
    }
  });
  submitButton.addEventListener('click', () =>
    navigateByHintHandler(input.value)
  );
  clearButton.addEventListener('click', clear);
  document.addEventListener('mousemove', backgroundObjectsParallax);
});
