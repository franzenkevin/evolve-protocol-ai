import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Footer = () => (
  <footer className="border-t border-border bg-card/40">
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="col-span-2 md:col-span-1">
        <img src={logo} alt="Hypertrophy" className="w-12 h-12 mb-3" />
        <p className="text-xs text-muted-foreground">
          © 2026 Hypertrophy. <br />
          Inteligência artificial fitness inteligente.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-foreground mb-3">App</p>
        <ul className="space-y-2 text-sm">
          <li><Link to="/signup" className="text-muted-foreground hover:text-primary">Começar agora</Link></li>
          <li><Link to="/login" className="text-muted-foreground hover:text-primary">Entrar</Link></li>
          <li><Link to="/plans" className="text-muted-foreground hover:text-primary">Planos</Link></li>
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-foreground mb-3">Suporte</p>
        <ul className="space-y-2 text-sm">
          <li><Link to="/support" className="text-muted-foreground hover:text-primary">Central de Ajuda</Link></li>
          <li><Link to="/feedback" className="text-muted-foreground hover:text-primary">Feedback</Link></li>
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-foreground mb-3">Legal</p>
        <ul className="space-y-2 text-sm">
          <li><Link to="/terms" className="text-muted-foreground hover:text-primary">Termos de Serviço</Link></li>
          <li><Link to="/terms" className="text-muted-foreground hover:text-primary">Privacidade</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);
