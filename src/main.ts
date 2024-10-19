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

// Elementos del DOM adicionales
const coverPage = document.getElementById('coverPage') as HTMLDivElement;
const mainApp = document.getElementById('mainApp') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;

if (startBtn) {
    startBtn.addEventListener('click', () => {
        // Ocultar la portada (coverPage)
        coverPage.classList.add('hidden');
        
        // Mostrar la pantalla principal (mainApp)
        mainApp.classList.add('show'); // Usamos 'show' para mostrar mainApp

        // Asegurarse de que la página se desplace al inicio de la pantalla principal
        window.scrollTo(0, 0); // Esto asegura que la página comience en la parte superior de 'mainApp'
    });
} else {
    console.error("No se encontró el botón con id 'startBtn'");
}

// Nuevas variables para los elementos del DOM
const darkModeToggle = document.getElementById('darkModeToggle') as HTMLButtonElement;
const mascotMessage = document.getElementById('mascotMessage') as HTMLParagraphElement;

// Función para alternar el modo oscuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    showMascotMessage(isDarkMode ? "¡Modo oscuro activado!" : "¡Modo claro activado!");
    
    // Actualizar el ícono del botón
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.setAttribute('aria-label', isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
}

// Función para mostrar mensajes de la mascota
function showMascotMessage(message: string) {
    mascotMessage.textContent = message;
    mascotMessage.classList.add('show');
    setTimeout(() => {
        mascotMessage.classList.remove('show');
    }, 5000);
}

// Función para inicializar la interfaz de usuario
function initUI() {
    const categoryEmojis: { [key: string]: string } = {
        'Proteínas': '🍗',
        'Verduras': '🥕',
        'Carbohidratos': '🍚',
        'Frutas': '🍎',
        'Lácteos': '🧀',
        'Especias y Hierbas': '🌿'
    };

    ingredientsGroups.forEach(({ groupName, ingredients }) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'ingredient-category';
        categoryDiv.innerHTML = `<h2>${categoryEmojis[groupName] || '🍽️'} ${groupName}</h2>`;
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

    startBtn.addEventListener('click', () => {
        coverPage.classList.add('hidden');
        mainApp.classList.remove('hidden');
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Asegurar que el modo claro esté activado por defecto
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');

    showMascotMessage("¡Bienvenido a SaborSync! Soy Ratatouille, tu chef virtual.");

    // Agregar interacciones periódicas
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% de probabilidad cada 30 segundos
            showMascotMessage(getRandomSuggestion());
        }
    }, 30000);
}

// Función para alternar la selección de ingredientes
function toggleIngredient(button: HTMLElement) {
    button.classList.toggle('selected');
    if (button.classList.contains('selected')) {
        showMascotMessage(`¡Excelente elección! ${button.textContent} puede ser delicioso en muchas recetas. ¿Qué más añadirás?`);
    } else {
        showMascotMessage(`Has quitado ${button.textContent}. A veces, menos es más. ¿Qué otros ingredientes combinarían bien?`);
    }
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
        Eres un chef experto. Crea 4 recetas gourmet utilizando algunos o todos los siguientes ingredientes: {ingredients}.
        Para cada receta, proporciona:
        1. Nombre creativo de la receta
        2. Breve descripción (máximo 2 frases)
        3. Lista de ingredientes con cantidades precisas (incluyendo los ingredientes seleccionados: {ingredients})
        4. Instrucciones paso a paso detalladas
        5. Tiempo de preparación y cocción
        6. Número de porciones
        Sé creativo y asegúrate de que las recetas sean sabrosas, bien equilibradas y con un toque gourmet.
        Devuelve la información en formato JSON para facilitar el procesamiento.
    `);

    const chain = prompt.pipe(chat).pipe(new StringOutputParser());

    try {
        console.log('Ingredientes seleccionados:', selectedIngredients);
        const response = await retryWithExponentialBackoff(() => 
            chain.invoke({
                ingredients: selectedIngredients.join(', ')
            })
        );

        console.log('Respuesta cruda de la API:', response);

        let recipes;
        try {
            recipes = JSON.parse(response);
        } catch (parseError) {
            console.error('Error al parsear la respuesta JSON:', parseError);
            console.log('Respuesta que causó el error:', response);
            recipes = processPlainTextResponse(response);
        }

        if (!Array.isArray(recipes)) {
            console.error('La respuesta no es un array de recetas:', recipes);
            recipes = [recipes];
        }

        if (recipes.length === 0) {
            throw new Error('No se generaron recetas');
        }

        displayRecipeCards(recipes);
        showMascotMessage("¡Recetas generadas! Echa un vistazo a estas deliciosas opciones.");
    } catch (error) {
        console.error('Error al generar las recetas:', error);
        alert('Hubo un error al generar las recetas. Por favor, intenta de nuevo con diferentes ingredientes.');
        showMascotMessage("Ups, parece que hubo un problema. ¿Qué tal si intentamos con otros ingredientes?");
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar Recetas';
    }
}

// Función para reintentar con retroceso exponencial
async function retryWithExponentialBackoff(operation: () => Promise<any>, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            if (error.response && error.response.status === 429) {
                const delay = Math.pow(2, i) * 1000;
                console.log(`Reintentando en ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Máximo número de reintentos alcanzado');
}

function processPlainTextResponse(response: string): any[] {
    const recipes = [];
    const recipeRegex = /Receta \d+:([\s\S]*?)(?=Receta \d+:|$)/g;
    let match;

    while ((match = recipeRegex.exec(response)) !== null) {
        const recipeText = match[1].trim();
        const recipe: any = {};
        
        const nameMatch = recipeText.match(/^(.+)$/m);
        recipe.name = nameMatch ? nameMatch[1].trim() : 'Receta sin nombre';
        
        const descriptionMatch = recipeText.match(/Descripción:([\s\S]*?)(?=Ingredientes:|$)/);
        recipe.description = descriptionMatch ? descriptionMatch[1].trim() : '';
        
        const ingredientsMatch = recipeText.match(/Ingredientes:([\s\S]*?)(?=Instrucciones:|$)/);
        recipe.ingredients = ingredientsMatch ? ingredientsMatch[1].trim().split('\n').map(i => i.trim()) : [];
        
        const instructionsMatch = recipeText.match(/Instrucciones:([\s\S]*?)(?=Tiempo de preparación:|$)/);
        recipe.instructions = instructionsMatch ? instructionsMatch[1].trim().split('\n').map(i => i.trim()) : [];
        
        const prepTimeMatch = recipeText.match(/Tiempo de preparación:\s*(.+)/);
        recipe.prep_time = prepTimeMatch ? prepTimeMatch[1].trim() : '';
        
        const cookTimeMatch = recipeText.match(/Tiempo de cocción:\s*(.+)/);
        recipe.cook_time = cookTimeMatch ? cookTimeMatch[1].trim() : '';
        
        const servingsMatch = recipeText.match(/Porciones:\s*(.+)/);
        recipe.servings = servingsMatch ? servingsMatch[1].trim() : '';
        
        recipes.push(recipe);
    }

    return recipes;
}

// Función para mostrar las tarjetas de recetas
function displayRecipeCards(recipes: any[]) {
    recipeCards.innerHTML = '';
    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-card-content">
                <h3>${recipe.name || recipe.recipe_name || `Receta ${index + 1}`}</h3>
                <p>${recipe.description || 'Descripción no disponible'}</p>
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
    console.log('Receta completa:', JSON.stringify(recipe, null, 2));

    let ingredientsList = 'No se encontraron ingredientes';
    if (recipe.ingredients) {
        if (Array.isArray(recipe.ingredients)) {
            ingredientsList = recipe.ingredients.map((ing: any) => {
                if (typeof ing === 'string') {
                    return `- ${ing}`;
                } else if (typeof ing === 'object' && ing !== null) {
                    const amount = ing.amount || ing.quantity || '';
                    const name = ing.name || ing.ingredient || ing.item || '';
                    return `- ${amount} ${name}`.trim();
                }
                return '';
            }).join('\n');
        } else if (typeof recipe.ingredients === 'string') {
            ingredientsList = recipe.ingredients;
        }
    }

    let instructionsList = 'No se encontraron instrucciones';
    if (recipe.instructions) {
        if (Array.isArray(recipe.instructions)) {
            instructionsList = recipe.instructions.map((step: any, index: number) => {
                if (typeof step === 'string') {
                    return `${index + 1}. ${step}`;
                } else if (typeof step === 'object' && step !== null) {
                    return `${index + 1}. ${step.step || ''}`;
                }
                return '';
            }).join('\n');
        } else if (typeof recipe.instructions === 'string') {
            instructionsList = recipe.instructions;
        }
    }

    const markedContent = await marked(`
# ${recipe.name || recipe.recipe_name || 'Nombre de la receta no disponible'}

${recipe.description || 'Descripción no disponible'}

## Ingredientes

${ingredientsList}

## Instrucciones

${instructionsList}

**Tiempo de preparación:** ${recipe.prep_time || recipe.prepTime || 'No especificado'}
**Tiempo de cocción:** ${recipe.cook_time || recipe.cookTime || 'No especificado'}
**Porciones:** ${recipe.servings || recipe.serves || 'No especificado'}
    `);
    
    recipeContent.innerHTML = markedContent;
    recipeList.classList.add('hidden');
    recipeDisplay.classList.remove('hidden');

    showMascotMessage(`¡${recipe.name} suena delicioso! Me encanta especialmente cómo has combinado los ingredientes. ¿Te animas a cocinarla?`);
}

// Función para volver a la lista de recetas
function showRecipeList() {
    recipeDisplay.classList.add('hidden');
    recipeList.classList.remove('hidden');
}

// Inicializar la interfaz de usuario cuando se carga la página
window.addEventListener('DOMContentLoaded', initUI);

console.log('Script main.ts cargado');

const mascotImg = document.querySelector('#mascot img') as HTMLImageElement;

const mascotSuggestions = [
    "¿Por qué no pruebas a combinar pollo con limón? ¡Es una combinación deliciosa!",
    "Las especias pueden transformar un plato simple en algo extraordinario. ¡Experimenta!",
    "No olvides los vegetales, ¡son la clave para una comida balanceada y colorida!",
    "¿Has considerado usar hierbas frescas? Pueden elevar cualquier receta a un nivel gourmet.",
    "Recuerda, la presentación es casi tan importante como el sabor. ¡Come también con los ojos!",
    "¿Qué tal si experimentas con una fusión de cocinas? ¡Mezcla sabores de diferentes culturas!",
    "Un toque de ácido puede equilibrar perfectamente un plato rico. Prueba con limón o vinagre.",
    "¿Sabías que el umami es el quinto sabor básico? ¡Busca ingredientes que lo aporten!",
    "La textura es importante en un plato. Combina elementos crujientes con suaves.",
    "¿Has probado a asar las verduras? Realza su sabor y les da un toque ahumado delicioso.",
    "Un buen cuchillo afilado es el mejor amigo de un chef. ¡Cuida tus herramientas!",
    "No temas experimentar. A veces, los mejores platos nacen de accidentes en la cocina.",
    "La cocina es un arte y tú eres el artista. ¡Deja volar tu creatividad!",
    "Un buen maridaje puede elevar tu comida. Experimenta con diferentes vinos o bebidas.",
    "¿Has pensado en hacer tu propio pan? El aroma en la cocina es incomparable.",
    "Recuerda siempre probar tu comida mientras cocinas. Ajusta los sabores sobre la marcha."
];

function getRandomSuggestion() {
    return mascotSuggestions[Math.floor(Math.random() * mascotSuggestions.length)];
}

mascotImg.addEventListener('click', () => {
    showMascotMessage(getRandomSuggestion());
});