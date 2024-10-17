import './style.css';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { marked } from 'marked';

// Elementos del DOM
const openApiKeyDialogBtn = document.getElementById('openApiKeyDialogBtn') as HTMLAnchorElement;
const apiKeyDialog = document.getElementById('apiKeyDialog') as HTMLDialogElement;
const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
const setApiKeyBtn = document.getElementById('setApiKeyBtn') as HTMLButtonElement;
const clearApiKeyBtn = document.getElementById('clearApiKeyBtn') as HTMLButtonElement;
const closeDialogBtn = document.getElementById('closeDialogBtn') as HTMLButtonElement;
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const recipeDisplay = document.getElementById('recipeDisplay') as HTMLDivElement;
const ingredientSelection = document.getElementById('ingredientSelection') as HTMLDivElement;

// Variables globales
let groqApiKey = localStorage.getItem('groqApiKey') || '';

// Definir los ingredientes por categoría
const ingredients = {
    proteins: ['Pollo', 'Res', 'Pescado', 'Tofu', 'Huevos'],
    vegetables: ['Zanahoria', 'Brócoli', 'Espinaca', 'Tomate', 'Pimiento'],
    carbs: ['Arroz', 'Pasta', 'Papa', 'Quinoa', 'Pan']
};

// Funciones para manejar la modal
function openModal() {
    apiKeyDialog.showModal();
}

function closeModal() {
    apiKeyDialog.close();
}

// Event listeners para la modal
openApiKeyDialogBtn.addEventListener('click', openModal);
closeDialogBtn.addEventListener('click', closeModal);
apiKeyDialog.addEventListener('click', (event) => {
    const rect = apiKeyDialog.getBoundingClientRect();
    const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height
        && rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        apiKeyDialog.close();
    }
});

// Event listeners para manejar la API Key
setApiKeyBtn.addEventListener('click', () => {
    groqApiKey = apiKeyInput.value;
    localStorage.setItem('groqApiKey', groqApiKey);
    alert('API Key establecida correctamente.');
    closeModal();
});

clearApiKeyBtn.addEventListener('click', () => {
    localStorage.removeItem('groqApiKey');
    groqApiKey = '';
    apiKeyInput.value = '';
    alert('API Key limpiada.');
});

// Función para inicializar la interfaz de usuario
function initUI() {
    Object.entries(ingredients).forEach(([category, items]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'ingredient-category';
        categoryDiv.innerHTML = `<h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>`;
        const listDiv = document.createElement('div');
        listDiv.className = 'ingredient-list';
        items.forEach(item => {
            const button = document.createElement('div');
            button.className = 'ingredient';
            button.textContent = item;
            button.onclick = () => toggleIngredient(button);
            listDiv.appendChild(button);
        });
        categoryDiv.appendChild(listDiv);
        ingredientSelection.appendChild(categoryDiv);
    });

    generateBtn.addEventListener('click', generateRecipe);
}

// Función para alternar la selección de ingredientes
function toggleIngredient(button: HTMLElement) {
    button.classList.toggle('selected');
}

// Función para generar la receta
async function generateRecipe() {
    const selectedIngredients = Array.from(document.querySelectorAll('.ingredient.selected'))
        .map(el => el.textContent)
        .filter(Boolean);

    if (selectedIngredients.length === 0) {
        alert('Por favor, selecciona al menos un ingrediente.');
        return;
    }

    const chat = new ChatGroq({
        apiKey: groqApiKey,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
        Eres un chef experto. Crea una receta utilizando los siguientes ingredientes: {ingredients}.
        La receta debe incluir:
        1. Nombre de la receta
        2. Lista de ingredientes con cantidades
        3. Instrucciones paso a paso
        4. Tiempo de preparación y cocción
        5. Porciones
        Sé creativo y asegúrate de que la receta sea sabrosa y bien equilibrada.
    `);

    const chain = prompt.pipe(chat).pipe(new StringOutputParser());

    try {
        const response = await chain.invoke({
            ingredients: selectedIngredients.join(', ')
        });

        recipeDisplay.innerHTML = marked(response);
    } catch (error) {
        console.error('Error al generar la receta:', error);
        alert('Hubo un error al generar la receta. Por favor, intenta de nuevo.');
    }
}

// Inicializar la interfaz de usuario cuando se carga la página
window.addEventListener('DOMContentLoaded', initUI);

console.log('Script main.ts cargado');
