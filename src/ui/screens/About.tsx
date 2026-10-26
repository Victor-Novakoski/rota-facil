import { useState } from 'react';
import { APP_VERSION, SUPPORT_WHATSAPP } from '../config';

export function About({ onErase }: { onErase: () => void }) {
  const [erased, setErased] = useState(false);
  return (
    <main className="screen">
      <h1>Sobre o Rota Fácil</h1>
      <section className="card">
        <h2>Privacidade</h2>
        <p>Tudo acontece no seu celular. A planilha é lida e convertida no próprio aparelho, e nenhum endereço ou rastreio é enviado para servidor nenhum.</p>
        <p>O app não tem cadastro e não usa ferramentas de rastreamento. Ele lembra, no próprio celular, qual transportadora e app de rota você usou da última vez.</p>
        <p>Para você não perder as edições se o app fechar, a planilha do dia fica guardada neste celular até o dia seguinte. Ela é apagada sozinha amanhã ou quando você abre outra planilha.</p>
        <button type="button" className="linkbtn" onClick={() => { onErase(); setErased(true); }}>
          Apagar agora os dados deste celular
        </button>
        {erased && <p className="muted small" role="status">Pronto: nenhuma planilha guardada neste celular.</p>}
      </section>
      <section className="card">
        <h2>Quem faz</h2>
        <p>O Rota Fácil é um app independente e gratuito, feito para entregadores. Não tem ligação com a iMile, com o Spoke nem com nenhuma transportadora. Ele lê planilhas compatíveis com as da iMile e gera arquivos para importar no Spoke.</p>
      </section>
      {SUPPORT_WHATSAPP && (
        <a className="btn secondary" href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Rota Fácil ${APP_VERSION}: encontrei um problema`)}`} target="_blank" rel="noopener noreferrer">
          Avisar um problema pelo WhatsApp
        </a>
      )}
      <p className="muted small">Versão {APP_VERSION}</p>
    </main>
  );
}
