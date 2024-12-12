/*function CreateTask() {
    // Get the last task ID from localStorage or initialize it if not found
    let lastTaskId = localStorage.getItem("lastTaskId");
  
    // If lastTaskId is null, initialize it to 0
    if (lastTaskId === null) {
        lastTaskId = 0;
    } else {
        lastTaskId = parseInt(lastTaskId); // Convert it to an integer
    }
  
    // Increment the task ID
    const id = lastTaskId + 1;
  
    // Store the new task ID in localStorage for future use
    localStorage.setItem("lastTaskId", id);
  
    // Create the task key and description-
    const key = task-${id};
    const taskid = document.getElementById("task-title").value;
    const taskDescription = document.getElementById('task-desc').value;
    const taskDeadline = document.getElementById('task-deadline').value;
    const selectedWorkarea = document.querySelector('input[name="workarea"]:checked').value;
    const postItColour = "rgb(255, 255, 255)";
    const description = ${taskName};${taskDescription};${taskDeadline};${selectedWorkarea};
  
    // Store the task in localStorage
    localStorage.setItem(key, description);
  
    console.log("Se ha creado una nueva tarea con ID:", id);
  
    window.location.reload();
  }
  
  
    // Get the element that should trigger the CreateTask function
  
    const taskColumn = document.getElementById('save-task');
    taskColumn.addEventListener('click', CreateTask);
  
    // Attach the event listener to the element*/