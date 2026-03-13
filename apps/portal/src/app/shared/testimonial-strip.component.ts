import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { PublicLocale } from "../content/public-site";

@Component({
  selector: "app-testimonial-strip",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="testimonial-strip">
      <div class="site-shell">
        <div class="section-heading">
          <span class="eyebrow">{{ locale === "es" ? "Lo que dicen" : "What they say" }}</span>
          <h2>{{ locale === "es" ? "Equipos que ya decidieron." : "Teams that already decided." }}</h2>
        </div>
        <div class="testimonial-strip__grid">
          <article class="testimonial-strip__card" *ngFor="let t of testimonials">
            <blockquote class="testimonial-strip__quote">
              &ldquo;{{ locale === "es" ? t.quoteEs : t.quoteEn }}&rdquo;
            </blockquote>
            <footer class="testimonial-strip__author">
              <strong>{{ t.name }}</strong>
              <span>{{ locale === "es" ? t.roleEs : t.roleEn }}</span>
              <span class="testimonial-strip__company">{{ locale === "es" ? t.companyEs : t.companyEn }}</span>
            </footer>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .testimonial-strip {
      background: var(--surface-dark, #081424);
      color: #fff;
      padding: 5rem 0;
    }
    .testimonial-strip .section-heading h2 { color: #fff; }
    .testimonial-strip .eyebrow { color: var(--gold, #c29a52); }
    .testimonial-strip__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2.5rem;
    }
    .testimonial-strip__card {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 2rem;
    }
    .testimonial-strip__quote {
      font-size: 1rem;
      line-height: 1.7;
      font-style: italic;
      margin: 0;
      color: rgba(255,255,255,0.85);
    }
    .testimonial-strip__author {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.875rem;
    }
    .testimonial-strip__author strong {
      font-weight: 700;
      color: #fff;
    }
    .testimonial-strip__author span {
      color: rgba(255,255,255,0.65);
    }
    .testimonial-strip__company {
      color: var(--gold, #c29a52) !important;
      font-size: 0.8rem;
    }
  `],
})
export class TestimonialStripComponent {
  @Input() locale: PublicLocale = "es";

  testimonials = [
    {
      quoteEs: "Desplegamos Talkaris en nuestra web en un día. El ROI fue visible en la primera semana de demos.",
      quoteEn: "We deployed Talkaris on our website in a day. ROI was visible in the first week of demos.",
      name: "Sergio M.",
      roleEs: "CTO",
      roleEn: "CTO",
      companyEs: "SaaS de gestión inmobiliaria",
      companyEn: "Property management SaaS",
    },
    {
      quoteEs: "El aislamiento por tenant era exactamente lo que necesitábamos para nuestros clientes enterprise.",
      quoteEn: "The tenant isolation was exactly what we needed for our enterprise clients.",
      name: "Laura P.",
      roleEs: "Head of Product",
      roleEn: "Head of Product",
      companyEs: "Agencia digital B2B",
      companyEn: "B2B digital agency",
    },
    {
      quoteEs: "La ingesta de YouTube nos ahorró semanas de documentación manual.",
      quoteEn: "The YouTube ingestion saved us weeks of manual documentation work.",
      name: "Ana C.",
      roleEs: "Knowledge Manager",
      roleEn: "Knowledge Manager",
      companyEs: "Portal de formación técnica",
      companyEn: "Technical training portal",
    },
  ];
}
