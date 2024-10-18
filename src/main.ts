import './style.css';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { marked } from 'marked';

// Elementos del DOM
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const recipeList = document.getElementById('recipeList') as HTMLElement;
const recipeCards = document.getElementById('recipeCards') as HTMLDivElement;
const recipeDisplay = document.getElementById('recipeDisplay') as HTMLElement;
const recipeContent = document.getElementById('recipeContent') as HTMLDivElement;
const backToListBtn = document.getElementById('backToListBtn') as HTMLButtonElement;
const ingredientSelection = document.getElementById('ingredientSelection') as HTMLDivElement;

// API Key predefinida
const API_KEY = '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';

// Definir los ingredientes por categoría (ampliado)
const ingredientsGroups: Array<{ groupName: string; ingredients: string[] }> = [
    { groupName: 'Proteínas', ingredients: ['Pollo', 'Ternera', 'Pescado', 'Tofu', 'Huevos', 'Cerdo', 'Lentejas', 'Garbanzos'] },
    { groupName: 'Verduras', ingredients: ['Zanahoria', 'Brócoli', 'Espinaca', 'Tomate', 'Pimiento', 'Calabacín', 'Berenjena', 'Cebolla', 'Ajo'] },
    { groupName: 'Carbohidratos', ingredients: ['Arroz', 'Pasta', 'Papa', 'Quinoa', 'Pan', 'Cuscús', 'Avena', 'Batata', 'Yuca'] },
    { groupName: 'Frutas', ingredients: ['Manzana', 'Plátano', 'Fresa', 'Naranja', 'Mango', 'Piña', 'Uvas', 'Kiwi'] },
    { groupName: 'Lácteos', ingredients: ['Queso', 'Yogur', 'Leche', 'Crema', 'Mantequilla', 'Queso crema'] },
    { groupName: 'Especias y Hierbas', ingredients: ['Cilantro', 'Perejil', 'Albahaca', 'Orégano', 'Comino', 'Pimentón', 'Curry', 'Jengibre'] }
];

// Función para inicializar la interfaz de usuario
function initUI() {
    ingredientsGroups.forEach(({ groupName, ingredients }) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'ingredient-category';
        categoryDiv.innerHTML = `<h2>${groupName}</h2>`;
        const listDiv = document.createElement('div');
        listDiv.className = 'ingredient-list';
        ingredients.forEach(item => {
            const button = document.createElement('div');
            button.className = 'ingredient';
            button.textContent = item;
            button.onclick = () => toggleIngredient(button);
            listDiv.appendChild(button);
        });
        categoryDiv.appendChild(listDiv);
        ingredientSelection.appendChild(categoryDiv);
    });

    generateBtn.addEventListener('click', generateRecipes);
    backToListBtn.addEventListener('click', showRecipeList);
}

// Función para alternar la selección de ingredientes
function toggleIngredient(button: HTMLElement) {
    button.classList.toggle('selected');
}

// Función para generar las recetas
async function generateRecipes() {
    const selectedIngredients = Array.from(document.querySelectorAll('.ingredient.selected'))
        .map(el => el.textContent)
        .filter(Boolean) as string[];

    if (selectedIngredients.length === 0) {
        alert('Por favor, selecciona al menos un ingrediente.');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generando...';

    const chat = new ChatGroq({
        apiKey: API_KEY,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
        Eres un chef experto. Crea 5 recetas gourmet utilizando algunos o todos los siguientes ingredientes: {ingredients}.
        Para cada receta, proporciona:
        1. Nombre creativo de la receta
        2. Breve descripción (máximo 2 frases)
        3. URL de una imagen generada que represente el plato (usa un servicio de generación de imágenes)
        4. Lista de ingredientes con cantidades precisas (asegúrate de incluir los ingredientes seleccionados: {ingredients})
        5. Instrucciones paso a paso detalladas
        6. Tiempo de preparación y cocción
        7. Número de porciones
        8. Sugerencia de presentación
        9. Maridaje recomendado (si aplica)
        Sé creativo y asegúrate de que las recetas sean sabrosas, bien equilibradas y con un toque gourmet.
        Devuelve la información en formato JSON para facilitar el procesamiento.
    `);

    const chain = prompt.pipe(chat).pipe(new StringOutputParser());

    try {
        const response = await chain.invoke({
            ingredients: selectedIngredients.join(', ')
        });

        const recipes = JSON.parse(response);
        console.log('Recetas recibidas:', recipes); // Añade esta línea
        displayRecipeCards(recipes);
    } catch (error) {
        console.error('Error al generar las recetas:', error);
        alert('Hubo un error al generar las recetas. Por favor, intenta de nuevo.');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar Recetas';
    }
}

// Función para mostrar las tarjetas de recetas
function displayRecipeCards(recipes: any[]) {
    recipeCards.innerHTML = '';
    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${recipe.imageUrl}" alt="${recipe.name}">
            <div class="recipe-card-content">
                <h3>${recipe.name}</h3>
                <p>${recipe.description}</p>
            </div>
        `;
        card.onclick = () => {
            showRecipeDetails(recipe).catch(error => {
                console.error('Error al mostrar los detalles de la receta:', error);
                alert('Hubo un error al mostrar los detalles de la receta. Por favor, intenta de nuevo.');
            });
        };
        recipeCards.appendChild(card);
    });
    recipeList.classList.remove('hidden');
    recipeDisplay.classList.add('hidden');
}

// Función para mostrar los detalles de una receta
async function showRecipeDetails(recipe: any) {
    const markedContent = await marked(`
# ${recipe.name}

${recipe.description}

![${recipe.name}](${recipe.imageUrl})

## Ingredientes

${recipe.ingredients.map((ing: string) => `- ${ing}`).join('\n')}

## Instrucciones

${recipe.instructions.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n')}

**Tiempo de preparación:** ${recipe.prepTime}
**Tiempo de cocción:** ${recipe.cookTime}
**Porciones:** ${recipe.servings}

## Presentación

${recipe.presentation}

## Maridaje

${recipe.pairing || 'No se recomienda maridaje específico para esta receta.'}
    `);
    
    recipeContent.innerHTML = markedContent;
    recipeList.classList.add('hidden');
    recipeDisplay.classList.remove('hidden');
}

// Función para volver a la lista de recetas
function showRecipeList() {
    recipeDisplay.classList.add('hidden');
    recipeList.classList.remove('hidden');
}

// Inicializar la interfaz de usuario cuando se carga la página
window.addEventListener('DOMContentLoaded', initUI);

console.log('Script main.ts cargado');
