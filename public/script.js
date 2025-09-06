document.addEventListener('DOMContentLoaded', () => {

    const galeria = document.getElementById('galeria');
    const modal = document.getElementById('modal-upload');
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const form = document.querySelector('#modal-upload form');
    const audio = document.getElementById('musica-fundo');
    const btnMusica = document.getElementById('btn-musica');

    // Funções do Modal
    const abrirModal = () => modal.classList.add('aberto');
    const fecharModal = () => modal.classList.remove('aberto');
    btnAbrir.addEventListener('click', abrirModal);
    btnFechar.addEventListener('click', fecharModal);

    // Função para criar um cartão de foto no HTML
    const criarCartao = (foto) => {
        return `
            <article class="cartao-foto" data-id="${foto.id}">
                <button class="btn-delete">🗑️</button>
                <img src="${foto.caminho}" alt="${foto.titulo}">
                <div class="info-foto">
                    <h3>${foto.titulo}</h3>
                    <p>${foto.descricao}</p>
                </div>
            </article>
        `;
    };

    // Função para carregar todas as fotos do servidor
    const carregarFotos = async () => {
        try {
            const response = await fetch('/fotos');
            const fotos = await response.json();
            galeria.innerHTML = '';
            fotos.forEach(foto => {
                galeria.insertAdjacentHTML('beforeend', criarCartao(foto));
            });
        } catch (error) {
            console.error("Erro ao carregar fotos:", error);
        }
    };

    // Lógica do formulário de envio
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        try {
            await fetch('/upload', { method: 'POST', body: formData });
            await carregarFotos();
            form.reset();
            fecharModal();
        } catch (error) {
            console.error("Erro ao fazer upload:", error);
            alert("Não foi possível enviar a foto. Tente novamente.");
        }
    });

    // Lógica para deletar
    galeria.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-delete')) {
            const cartao = event.target.closest('.cartao-foto');
            const id = cartao.dataset.id;
            
            if (confirm('Tem certeza que quer apagar esta memória para sempre?')) {
                try {
                    await fetch(`/fotos/${id}`, { method: 'DELETE' });
                    cartao.remove();
                } catch (error) {
                    console.error("Erro ao deletar:", error);
                    alert("Não foi possível apagar a foto. Tente novamente.");
                }
            }
        }
    });

    // Lógica da Música
    if(audio && btnMusica) {
        audio.volume = 0.3;
        btnMusica.addEventListener('click', () => {
          if (audio.paused) {
            audio.play();
            btnMusica.textContent = '⏸️';
          } else {
            audio.pause();
            btnMusica.textContent = '▶️';
          }
        });
    }

    // Carrega tudo quando a página abre
    carregarFotos();
});