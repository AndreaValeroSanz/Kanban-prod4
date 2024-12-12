window.dragInit = function () {
    const columns = [
        document.querySelector('#on-hold [slot="content"]'),
        document.querySelector('#not-started [slot="content"]'),
        document.querySelector('#in-progress [slot="content"]'),
        document.querySelector('#review-ready [slot="content"]'),
        document.querySelector('#done [slot="content"]')
    ];

    // Map column IDs to the corresponding types
    const columnTypeMap = {
        'on-hold': 'on-hold',
        'not-started': 'not-started',
        'in-progress': 'in-progress',
        'review-ready': 'review-ready',
        'done': 'done'
    };

    // Add placeholders for empty columns initially
    columns.forEach(column => {
        if (column) {
            updatePlaceholder(column);
        }
    });

    // Initialize drag and drop on all draggable items
    const draggableItems = document.querySelectorAll('.drag');
    draggableItems.forEach(item => {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    // Set up dragover and drop events for columns
    columns.forEach(column => {
        if (column) {
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('drop', handleDrop);
        }
    });

    let draggedItem = null;
    let sourceColumn = null;

    function handleDragStart(e) {
        draggedItem = e.target;
        sourceColumn = draggedItem.parentNode;
        updatePlaceholder(sourceColumn); // Check for placeholders in the source column
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", e.target.id);
    }

    function handleDragEnd(e) {
        draggedItem = null;
        sourceColumn = null;
        window.location.reload();
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    async function handleDrop(e) {
        e.preventDefault();
        const targetColumn = e.currentTarget;

        if (draggedItem) {
            targetColumn.appendChild(draggedItem);

            // Use the targetColumn's parent element to get the ID
            const columnId = targetColumn.closest('[id]').id; // Get the closest ancestor with an ID
            const newType = columnTypeMap[columnId];

            if (newType) {
                const cardId = draggedItem.querySelector('task-sticker').getAttribute('card-id');
                console.log(`Attempting to update card ID: ${cardId} to type: ${newType}`);

                try {
                    await updateCardType(cardId, newType);
                    console.log(`Successfully updated card type for ID: ${cardId} to ${newType}`);
                } catch (error) {
                    console.error(`Failed to update card type for ID: ${cardId}`, error);
                }
            } else {
                console.error(`Could not determine new type for target column with ID: ${columnId}`);
            }

            // Update placeholders for both the source and target columns
            if (sourceColumn) {
                updatePlaceholder(sourceColumn);
            }
            updatePlaceholder(targetColumn);
        }
    }

    async function updateCardType(cardId, newType) {
        const token = localStorage.getItem('token');
        const mutation = `
            mutation {
                updateCardType(id: "${cardId}", type: "${newType}") {
                    _id
                    type
                }
            }
        `;

        try {
            const response = await fetch('http://localhost:3000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: mutation }),
            });

            if (!response.ok) {
                throw new Error(`Error updating card type: ${response.status}`);
            }

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data.updateCardType;
        } catch (error) {
            console.error('Error updating card type:', error);
            throw error;
        }
    }

    function updatePlaceholder(column) {
        if (!column) return; // Guard clause to ensure column is valid

        const hasItems = column.querySelector('.drag');
        let placeholder = column.querySelector('.placeholder');

        if (hasItems && placeholder) {
            // If there are items and a placeholder exists, remove the placeholder
            column.removeChild(placeholder);
        } else if (!hasItems && !placeholder) {
            // If there are no items and no placeholder, add the placeholder
            placeholder = document.createElement('div');
            placeholder.classList.add('placeholder');
            placeholder.innerHTML = '<p>Drop items here</p>';
            column.appendChild(placeholder);
        }
    }
};
