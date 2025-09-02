const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const notification = document.getElementById("notification");
const totalTasksSpan = document.getElementById("totalTasks");
const activeTasksSpan = document.getElementById("activeTasks");
const completedTasksSpan = document.getElementById("completedTasks");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// Initialize the app
function init() {
  updateStats();
  renderTasks();
  
  // Add event listeners
  taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTask();
  });
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderTasks();
    });
  });
  
  // Intro animation
  gsap.from(".container", { duration: 1, scale: 0.8, opacity: 0, ease: "back.out(1.7)" });
  gsap.from("h1", { duration: 1, y: -30, opacity: 0, delay: 0.3, ease: "power2.out" });
  gsap.from(".input-group", { duration: 0.8, y: 30, opacity: 0, delay: 0.5, ease: "power2.out" });
}

// Add a new task
function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") {
    showNotification("Please enter a task!", "error");
    gsap.to(taskInput, { duration: 0.5, x: 10, ease: "power1.inOut", repeat: 3, yoyo: true });
    return;
  }
  
  const newTask = {
    id: Date.now(),
    text: taskText,
    completed: false,
    timestamp: new Date().toISOString()
  };
  
  tasks.unshift(newTask);
  saveTasks();
  updateStats();
  
  // Clear input and show notification
  taskInput.value = "";
  showNotification("Task added successfully!", "success");
  
  // Render tasks based on current filter
  renderTasks();
  
  // Create confetti effect
  createConfetti();
}

// Toggle task completion
function toggleTask(id) {
  const task = tasks.find(task => task.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    updateStats();
    
    if (task.completed) {
      showNotification("Task completed! 🎉", "success");
      // Move animation for completed task
      const taskElement = document.querySelector(`li[data-id="${id}"]`);
      if (taskElement) {
        gsap.to(taskElement, {
          duration: 0.5,
          y: 20,
          opacity: 0,
          onComplete: () => {
            renderTasks();
          }
        });
      }
    } else {
      // Move task back to active
      renderTasks();
      showNotification("Task marked as active!", "info");
    }
  }
}

// Edit a task
function editTask(id) {
  const task = tasks.find(task => task.id === id);
  if (task) {
    const newText = prompt("Edit your task:", task.text);
    if (newText !== null && newText.trim() !== "") {
      task.text = newText.trim();
      saveTasks();
      renderTasks();
      showNotification("Task updated successfully!", "success");
    }
  }
}

// Delete a task
function deleteTask(id) {
  const taskElement = document.querySelector(`li[data-id="${id}"]`);
  
  gsap.to(taskElement, {
    duration: 0.5,
    x: 100,
    opacity: 0,
    onComplete: () => {
      tasks = tasks.filter(task => task.id !== id);
      saveTasks();
      updateStats();
      renderTasks();
      showNotification("Task deleted!", "info");
    }
  });
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Update task statistics
function updateStats() {
  const total = tasks.length;
  const active = tasks.filter(task => !task.completed).length;
  const completed = tasks.filter(task => task.completed).length;
  
  totalTasksSpan.textContent = `Total: ${total} task${total !== 1 ? 's' : ''}`;
  activeTasksSpan.textContent = `Active: ${active}`;
  completedTasksSpan.textContent = `Completed: ${completed}`;
}

// Render tasks based on current filter
function renderTasks() {
  // Clear list
  taskList.innerHTML = '';
  
  // Filter tasks based on current selection
  let filteredTasks = [];
  
  if (currentFilter === 'all') {
    // Show only active tasks in "All"
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'active') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }
  
  // Show/hide empty state
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    
    // Render tasks
    filteredTasks.forEach(task => {
      const li = createTaskElement(task);
      taskList.appendChild(li);
    });
  }
  
  // Animate tasks
  const taskElements = document.querySelectorAll('li');
  taskElements.forEach((task, index) => {
    gsap.fromTo(task, 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, delay: index * 0.1 }
    );
  });
}

// Create task element
function createTaskElement(task) {
  const li = document.createElement("li");
  li.setAttribute('data-id', task.id);
  if (task.completed) li.classList.add('completed');
  
  li.innerHTML = `
    <div class="task-content" onclick="toggleTask(${task.id})">
      <div class="task-checkbox ${task.completed ? 'checked' : ''}">
        <i class="fas fa-check"></i>
      </div>
      <span class="task-text">${task.text}</span>
    </div>
    <div class="task-actions">
      <button class="action-btn edit-btn" onclick="event.stopPropagation(); editTask(${task.id})">
        <i class="fas fa-edit"></i>
      </button>
      <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteTask(${task.id})">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `;
  
  return li;
}

// Show notification
function showNotification(message, type = 'success') {
  notification.textContent = message;
  
  // Set background color based on type
  if (type === 'error') {
    notification.style.background = 'var(--danger)';
  } else if (type === 'info') {
    notification.style.background = 'var(--info)';
  } else {
    notification.style.background = 'var(--success)';
  }
  
  notification.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Create confetti effect
function createConfetti() {
  const container = document.querySelector('.container');
  
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.background = ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--warning)'][Math.floor(Math.random() * 4)];
    container.appendChild(confetti);
    
    gsap.to(confetti, {
      y: Math.random() * 200 + 100,
      x: Math.random() * 200 - 100,
      rotation: Math.random() * 360,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      onComplete: () => {
        confetti.remove();
      }
    });
  }
}

// Initialize the app
init();