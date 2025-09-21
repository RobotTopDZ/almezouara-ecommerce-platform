import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const FAQPage = () => {
  const { t } = useTranslation();
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "Comment passer une commande?",
      answer: "Pour passer une commande, parcourez nos produits, sélectionnez l'article souhaité, choisissez la taille et la couleur, puis cliquez sur 'Acheter maintenant'. Remplissez vos informations de livraison et confirmez votre commande."
    },
    {
      id: 2,
      question: "Quels sont les modes de livraison disponibles?",
      answer: "Nous proposons deux modes de livraison : livraison à domicile et livraison au bureau de poste (Stop Desk). Les frais de livraison varient selon la wilaya et le mode de livraison choisi."
    },
    {
      id: 3,
      question: "Quels sont les délais de livraison?",
      answer: "Les délais de livraison sont généralement de 2-5 jours ouvrables pour la livraison à domicile et 1-3 jours ouvrables pour le Stop Desk, selon votre localisation."
    },
    {
      id: 4,
      question: "Comment puis-je suivre ma commande?",
      answer: "Une fois votre commande confirmée, vous recevrez un numéro de commande. Vous pouvez suivre votre commande dans votre espace client ou nous contacter via WhatsApp avec votre numéro de commande."
    },
    {
      id: 5,
      question: "Quels sont les modes de paiement acceptés?",
      answer: "Nous acceptons le paiement à la livraison (cash on delivery). Le paiement se fait en espèces lors de la réception de votre commande."
    },
    {
      id: 6,
      question: "Puis-je échanger ou retourner un article?",
      answer: "Oui, vous pouvez retourner ou échanger un article dans les 7 jours suivant la réception, à condition qu'il soit dans son état d'origine avec ses étiquettes. Consultez notre politique de remboursement pour plus de détails."
    },
    {
      id: 7,
      question: "Comment connaître ma taille?",
      answer: "Chaque produit dispose d'un guide des tailles détaillé. Nous recommandons de consulter le tableau des tailles avant de passer commande. En cas de doute, n'hésitez pas à nous contacter."
    },
    {
      id: 8,
      question: "Les couleurs affichées sont-elles exactes?",
      answer: "Nous faisons de notre mieux pour afficher des couleurs précises, mais elles peuvent légèrement varier selon votre écran. Si vous n'êtes pas satisfait de la couleur reçue, vous pouvez échanger l'article."
    },
    {
      id: 9,
      question: "Comment créer un compte?",
      answer: "Cliquez sur l'icône compte dans le menu, puis sélectionnez 'S'inscrire'. Remplissez vos informations (nom complet, numéro de téléphone, mot de passe) pour créer votre compte."
    },
    {
      id: 10,
      question: "Comment contacter le service client?",
      answer: "Vous pouvez nous contacter via WhatsApp, par email à contact@almezouara.dz, ou en utilisant le formulaire de contact sur notre site. Nous répondons généralement dans les 24 heures."
    },
    {
      id: 11,
      question: "Proposez-vous des promotions?",
      answer: "Oui, nous proposons régulièrement des promotions et des réductions. Inscrivez-vous à notre newsletter et suivez nos réseaux sociaux pour être informé de nos offres spéciales."
    },
    {
      id: 12,
      question: "Livrez-vous dans toute l'Algérie?",
      answer: "Oui, nous livrons dans les 58 wilayas d'Algérie. Les frais de livraison varient selon la destination et le mode de livraison choisi."
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text mb-4">Questions Fréquemment Posées</h1>
          <p className="text-gray-600 text-lg">
            Trouvez rapidement les réponses à vos questions les plus courantes
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-medium text-text pr-4">
                  {faq.question}
                </h3>
                <div className={`transform transition-transform duration-200 ${openFAQ === faq.id ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {openFAQ === faq.id && (
                <div className="px-6 pb-4">
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-primary to-pink-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-pink-100 mb-6">
            Notre équipe de service client est là pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/+213XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-2.462-.996-4.779-2.811-6.598-1.815-1.819-4.145-2.817-6.609-2.817-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.281-.858zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
            <a
              href="/contact"
              className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Nous Contacter</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

