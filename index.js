import { getTasks, deleteTask } from './utils/taskFunctions.js';
import { initialData } from './initialData.js';  

// Initialize data to localStorage if not present
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true');
  } else {
    console.log('Data already exists in localStorage');
  }
}

// TASK: Get elements from the DOM
const elements = {
  headerBoardName: document.getElementById('header-board-name'),
  modalWindow: document.getElementById('new-task-modal-window'),
  filterDiv: document.getElementById('filterDiv'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  themeSwitch: document.getElementById('switch'),
  createNewTaskBtn: document.getElementById('add-new-task-btn'),
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  columnDivs: document.querySelectorAll('.column-div'),
};

let activeBoard = '';  // initializes an empy string for activeBoard. This stores current active board's name.

// Function to fetch and display boards and tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);

  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem('activeBoard'));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Display boards in the side panel
function displayBoards(boards) {
  const boardsContainer = document.getElementById('boards-nav-links-div');
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement('button');
    boardElement.textContent = board;
    boardElement.classList.add('board-btn');
    boardElement.addEventListener('click', () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; // assigns active board
      localStorage.setItem('activeBoard', JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filter tasks corresponding to the board name and display them
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from local storage
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute('data-status');
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container'; // Add class for styling
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-div');
        taskElement.textContent = task.title;
        taskElement.setAttribute('data-task-id', task.id);

        taskElement.addEventListener('click', () => {
          openEditTaskModal(task);
        });

        tasksContainer.appendChild(taskElement);
      });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Style the active board button
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Add a task to the UI in the appropriate column
function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);

  tasksContainer.appendChild(taskElement);
}

// Event listeners setup
function setupEventListeners() {
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));

  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));

  elements.themeSwitch.addEventListener('change', toggleTheme);

  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  elements.modalWindow.addEventListener('submit', (event) => {
    addTask(event);
  });
}

// Toggle modal visibility
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

// Add a task from the modal form
function addTask(event) {
  event.preventDefault();

  const task = {
    id: Date.now(),
    title: document.getElementById('title-input').value,
    description: document.getElementById('desc-input').value,
    status: document.getElementById('select-status').value,
    board: activeBoard,
  };

  const tasks = getTasks();
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  addTaskToUI(task);
  toggleModal(false);
  elements.filterDiv.style.display = 'none';
  event.target.reset();
  refreshTasksUI();
}

// Toggle the sidebar visibility
function toggleSidebar(show) {
  const sidebar = document.getElementById('side-bar-div');
  const showBtn = elements.showSideBarBtn;
  const hideBtn = elements.hideSideBarBtn;

  if (show) {
    sidebar.style.display = 'block';
    hideBtn.style.display = 'block';
    showBtn.style.display = 'none';
  } else {
    sidebar.style.display = 'none';
    hideBtn.style.display = 'none';
    showBtn.style.display = 'block';
  }
  
  localStorage.setItem('showSideBar', show.toString());
}

// Toggle the theme between light and dark
function toggleTheme() {
  const isLightTheme = elements.themeSwitch.checked;
  document.body.classList.toggle('light-theme', isLightTheme);
  localStorage.setItem('light-theme', isLightTheme ? 'enabled' : 'disabled');
}

// Max test refresh UI to apply the saved theme on page load
function applySavedTheme() {
  const savedTheme = localStorage.getItem('light-theme');
  if (savedTheme === 'enabled') {
    document.body.classList.add('light-theme'); // Apply the light theme
    elements.themeSwitch.checked = true; // Set the switch to checked
  } else {
    document.body.classList.remove('light-theme'); // Apply the dark theme
    elements.themeSwitch.checked = false; // Set the switch to unchecked
  }
}


// Open edit task modal and populate fields with task data
function openEditTaskModal(task) {
  document.getElementById('edit-task-title-input').value = task.title;
  document.getElementById('edit-task-desc-input').value = task.description;
  document.getElementById('edit-select-status').value = task.status;

  toggleModal(true, elements.editTaskModal);

  document.getElementById('save-task-changes-btn').onclick = () => {
    saveTaskChanges(task.id);
  };

  document.getElementById('delete-task-btn').onclick = () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  };
}

// Save changes to a task
function saveTaskChanges(taskId) {
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  tasks[taskIndex].title = document.getElementById('edit-task-title-input').value;
  tasks[taskIndex].description = document.getElementById('edit-task-desc-input').value;
  tasks[taskIndex].status = document.getElementById('edit-select-status').value;

  localStorage.setItem('tasks', JSON.stringify(tasks));
  refreshTasksUI();
  toggleModal(false, elements.editTaskModal);
}

//DOMContentLoaded event ensures the code runs after the after page is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  init(); //
});

//initializes data, set up event listeners, applies the saved theme, toogle sidebar visibilty and etc
function init() {
  initializeData();
  setupEventListeners();
  applySavedTheme(); // Apply the saved theme on page load
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  fetchAndDisplayBoardsAndTasks();
}
