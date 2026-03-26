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
  `})
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
