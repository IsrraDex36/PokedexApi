document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("pokemon-form");
    const input = document.getElementById("pokemon-name");
    const result = document.querySelector(".screen");
    const randomBtn = document.getElementById("random-pokemon");
    const resetBtn = document.getElementById("reset-button");
    const voiceToggle = document.getElementById("toggle-voice");
    const musicToggle = document.getElementById("music-toggle");
    const volumeControl = document.getElementById("volume-control");
    const bgMusic = document.getElementById("bg-music");
    

    // Colores para los tipos de Pokémon
    const typeColors = {
        normal: '#A8A878',
        fire: '#F08030',
        water: '#6890F0',
        electric: '#F8D030',
        grass: '#78C850',
        ice: '#98D8D8',
        fighting: '#C03028',
        poison: '#A040A0',
        ground: '#E0C068',
        flying: '#A890F0',
        psychic: '#F85888',
        bug: '#A8B820',
        rock: '#B8A038',
        ghost: '#705898',
        dragon: '#7038F8',
        dark: '#705848',
        steel: '#B8B8D0',
        fairy: '#EE99AC'
    };

    // Mensaje de bienvenida inicial
    const welcomeMessage = `
        <div class="welcome-message">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif" alt="Pikachu">
            <p>¡Bienvenido a la Pokédex!</p>
            <p>Busca un Pokémon por nombre o número</p>
        </div>
    `;

    // Variables del sistema de voz
    let voiceEnabled = true;
    let musicEnabled = true;
    const blipSound = document.getElementById("pokedex-blip");
    blipSound.volume = 0.3;

    // Configurar música de fondo
    bgMusic.volume = 0.0;

    // Mostrar mensaje de carga
    function showLoading() {
        result.innerHTML = `
            <div class="loading">
                <p>Buscando Pokémon...</p>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/132.gif" alt="Loading">
            </div>
        `;
    }

    // Mostrar mensaje de error
    function showError(message) {
        result.innerHTML = `
            <div class="error-message">
                <p>¡Oh no!</p>
                <p>${message}</p>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/54.gif" alt="Error">
            </div>
        `;
        
        if (voiceEnabled) {
            speakAsPokedex(`Error. ${message}`);
        }
    }

    // Función para hablar como la Pokédex
    function speakAsPokedex(text) {
        if (!voiceEnabled) return;
        
        window.speechSynthesis.cancel();
        blipSound.currentTime = 0;
        blipSound.play();

        const utterance = new SpeechSynthesisUtterance();
        utterance.text = text;
        utterance.lang = 'es-ES';
        utterance.rate = 0.85;
        utterance.pitch = 0.75;
        
        const voices = window.speechSynthesis.getVoices();
        const roboticVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Microsoft'));
        if (roboticVoice) utterance.voice = roboticVoice;

        window.speechSynthesis.speak(utterance);
    }

    // Generar texto para la voz
    function generateSpeechText(data) {
        const types = data.types.map(t => t.type.name);
        let text = `Pokémon encontrado: ${data.name}. `;
        
        text += `Tipo${types.length > 1 ? 's' : ''}: ${types.join(' y ')}. `;
        text += `Altura: ${(data.height/10).toFixed(1)} metros. `;
        text += `Peso: ${(data.weight/10).toFixed(1)} kilogramos. `;
        
        if (data.abilities && data.abilities.length > 0) {
            const abilities = data.abilities.map(a => a.ability ? a.ability.name : a);
            text += `Habilidad${abilities.length > 1 ? 'es' : ''}: ${abilities.slice(0, 2).join(' y ')}.`;
        }
        
        return text;
    }

    // Mostrar información del Pokémon
    function showPokemon(data) {
        const typesHTML = data.types.map(type => 
            `<span class="type-badge" style="background-color: ${typeColors[type.type.name]}">${type.type.name.toUpperCase()}</span>`
        ).join('');

        result.innerHTML = `
            <div class="pokemon-display">
                <h2>${data.name.toUpperCase()} <span class="pokemon-id">#${data.id.toString().padStart(3, '0')}</span></h2>
                <img src="${data.sprites.other['official-artwork'].front_default || data.sprites.front_default}" 
                     alt="${data.name}"
                     onload="window.startPokedexVoice(this)">
                <div class="types">${typesHTML}</div>
                <p><strong>ALTURA:</strong> ${(data.height / 10).toFixed(1)} m</p>
                <p><strong>PESO:</strong> ${(data.weight / 10).toFixed(1)} kg</p>
                <p><strong>HABILIDADES:</strong> ${data.abilities.map(ability => ability.ability.name).join(', ')}</p>
            </div>
        `;
    }

    // Función global para iniciar la voz
    window.startPokedexVoice = function(imgElement) {
        if (!voiceEnabled) return;
        
        const pokemonName = imgElement.alt;
        const typeElements = document.querySelectorAll('.type-badge');
        const abilityText = document.querySelector('p:nth-of-type(3)').textContent.split(':')[1].trim();
        
        const pokemonData = {
            name: pokemonName,
            types: [...typeElements].map(badge => ({
                type: { name: badge.textContent.toLowerCase() }
            })),
            height: parseFloat(document.querySelector('p:nth-of-type(1)').textContent.split(':')[1].trim().split(' ')[0]) * 10,
            weight: parseFloat(document.querySelector('p:nth-of-type(2)').textContent.split(':')[1].trim().split(' ')[0]) * 10,
            abilities: abilityText.split(', ').map(ability => ({ ability: { name: ability } }))
        };
        
        const speechText = generateSpeechText(pokemonData);
        speakAsPokedex(speechText);
    };

    // Control de música
    function toggleMusic() {
        musicEnabled = !musicEnabled;
        musicToggle.classList.toggle('off', !musicEnabled);
        musicToggle.innerHTML = musicEnabled ? '🔊' : '🔇';
        
        if (musicEnabled) {
            bgMusic.play().catch(e => console.log("Error al reproducir música:", e));
        } else {
            bgMusic.pause();
        }
    }

    // Configurar controles de audio
    function setupAudioControls() {
        // Configurar botón de música
        musicToggle.addEventListener('click', toggleMusic);
        
        // Configurar control de volumen
        volumeControl.addEventListener('input', (e) => {
            bgMusic.volume = e.target.value;
        });
        
        // Intentar iniciar música después de interacción del usuario
        document.body.addEventListener('click', () => {
            if (musicEnabled) {
                bgMusic.play().catch(e => console.log("Autoplay bloqueado:", e));
            }
        }, { once: true });
    }

    // Buscar Pokémon
    async function searchPokemon(pokemon) {
        showLoading();
        
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
            if (!response.ok) throw new Error("Pokémon no encontrado");
            const data = await response.json();
            showPokemon(data);
        } catch (error) {
            showError(error.message);
        }
    }

    // Obtener un Pokémon aleatorio
    async function getRandomPokemon() {
        try {
            const countResponse = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=0');
            const countData = await countResponse.json();
            const totalPokemon = countData.count;
            const randomId = Math.floor(Math.random() * totalPokemon) + 1;
            await searchPokemon(randomId);
        } catch (error) {
            showError("Error al obtener Pokémon aleatorio");
        }
    }

    // Resetear la Pokédex
    function resetPokedex() {
        result.innerHTML = welcomeMessage;
        input.value = '';
        window.speechSynthesis.cancel();
    }

    // Configurar el botón de voz
    function setupVoiceToggle() {
        voiceToggle.addEventListener('click', () => {
            voiceEnabled = !voiceEnabled;
            voiceToggle.classList.toggle('off', !voiceEnabled);
            voiceToggle.textContent = voiceEnabled ? '🔊 Voz ON' : '🔇 Voz OFF';
            
            if (!voiceEnabled) {
                window.speechSynthesis.cancel();
            } else {
                speakAsPokedex("Voz activada");
            }
        });
    }

    // Inicializar el sistema de voz
    function initVoiceSystem() {
        if (!'speechSynthesis' in window) {
            console.warn("Tu navegador no soporta síntesis de voz");
            voiceToggle.style.display = 'none';
            voiceEnabled = false;
            return;
        }
        
        window.speechSynthesis.getVoices();
    }

    // Event listeners
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pokemonName = input.value.toLowerCase().trim();
        if (!pokemonName) return;
        await searchPokemon(pokemonName);
    });

    randomBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await getRandomPokemon();
    });

    resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        resetPokedex();
    });

    // Inicializar sistemas
    initVoiceSystem();
    setupVoiceToggle();
    setupAudioControls();
    resetPokedex();
});