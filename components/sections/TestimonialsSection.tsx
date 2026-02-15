import { FC } from "react";

export const TestimonialsSection: FC = () => {
  const testimonials = [
    {
      name: "Priya K.",
      role: "Mid-Level Engineer",
      initial: "P",
      gradient: "from-blue-500 to-purple-500",
      bgGradient: "from-blue-50 to-purple-50",
      borderColor: "border-blue-100",
      quote:
        "Started with AI practice to build confidence, then moved to peer sessions. After 8 practices total, I landed Amazon. The combination of behavioral prep and anxiety techniques actually worked—went from freezing up to feeling genuinely calm.",
      badge: "Anxiety conquered",
      badgeColor: "text-primary",
    },
    {
      name: "Marcus T.",
      role: "Senior Engineer",
      initial: "M",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-100",
      quote:
        "Practiced both behavioral and technical interviews with peers who understood my struggles. The anxiety techniques helped me go from rambling to delivering clear, confident answers. Worth every penny.",
      badge: "Anxiety conquered",
      badgeColor: "text-purple-600",
    },
    {
      name: "Sarah L.",
      role: "Staff Engineer",
      initial: "S",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-100",
      quote:
        "The breathing techniques and exposure practice completely changed my interview experience. I went from panic attacks to actually enjoying conversations. Landed at Stripe feeling confident for the first time.",
      badge: "Now at Stripe",
      badgeColor: "text-green-600",
    },
  ];

  const Star: FC = () => (
    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            Success Stories
          </p>
          <h2
            id="testimonials-heading"
            className="text-5xl md:text-6xl font-black mb-6 text-secondary"
          >
            From Anxious to Confident
          </h2>
          <p className="text-xl text-neutral-600">
            Real stories from engineers who conquered their interview anxiety
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8" role="list" aria-label="User testimonials">
          {testimonials.map((testimonial, index) => (
            <article
              key={index}
              role="listitem"
              aria-label={`Review by ${testimonial.name}`}
              className={`hover-lift bg-gradient-to-br ${testimonial.bgGradient} rounded-2xl p-8 border-2 ${testimonial.borderColor}`}
            >
              <div className="flex items-center mb-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4`}
                  aria-hidden="true"
                >
                  {testimonial.initial}
                </div>
                <div>
                  <p className="font-bold text-lg text-secondary">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-neutral-600">{testimonial.role}</p>
                  <div className="flex mt-1" aria-label="5 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} />
                    ))}
                  </div>
                </div>
              </div>
              <blockquote className="text-neutral-800 text-lg leading-relaxed mb-4">
                &quot;{testimonial.quote}&quot;
              </blockquote>
              <div
                className={`inline-flex items-center px-4 py-2 bg-white/60 rounded-full text-sm font-semibold ${testimonial.badgeColor}`}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {testimonial.badge}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
