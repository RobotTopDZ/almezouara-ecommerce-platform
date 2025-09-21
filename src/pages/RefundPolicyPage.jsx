import React from 'react';
import { useTranslation } from 'react-i18next';

const RefundPolicyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text mb-4">Politique de Remboursement</h1>
            <p className="text-gray-600">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Notre Engagement
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Chez Almezouara, votre satisfaction est notre priorité. Nous nous engageons à fournir des produits de qualité et un service client exceptionnel. Si vous n'êtes pas entièrement satisfait de votre achat, nous offrons une politique de retour et d'échange flexible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Délai de Retour
              </h2>
              <div className="bg-pink-50 border-l-4 border-primary p-4 mb-4">
                <p className="text-gray-700">
                  <strong>Vous disposez de 7 jours</strong> à compter de la date de réception de votre commande pour initier un retour ou un échange.
                </p>
              </div>
              <p className="text-gray-700">
                Ce délai nous permet de traiter votre demande rapidement tout en maintenant la qualité de nos produits pour tous nos clients.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Conditions de Retour
              </h2>
              <p className="text-gray-700 mb-4">Pour être éligible à un retour ou échange, votre article doit respecter les conditions suivantes :</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  L'article doit être dans son état d'origine, non porté et non endommagé
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Toutes les étiquettes d'origine doivent être attachées
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  L'article doit être retourné dans son emballage d'origine
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aucune odeur de parfum, transpiration ou autres odeurs
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Processus de Retour
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-text mb-2">1. Contactez-nous</h3>
                  <p className="text-gray-700">
                    Contactez notre service client via WhatsApp ou email avec votre numéro de commande et la raison du retour.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-text mb-2">2. Obtenez l'autorisation</h3>
                  <p className="text-gray-700">
                    Nous vous fournirons un numéro d'autorisation de retour et les instructions d'expédition.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-text mb-2">3. Expédiez l'article</h3>
                  <p className="text-gray-700">
                    Emballez soigneusement l'article et expédiez-le à l'adresse indiquée.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-text mb-2">4. Traitement</h3>
                  <p className="text-gray-700">
                    Une fois reçu et inspecté, nous traiterons votre remboursement ou échange sous 3-5 jours ouvrables.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Frais de Retour
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-gray-700">
                  <strong>Articles défectueux ou erreur de notre part :</strong> Nous prenons en charge tous les frais de retour.
                </p>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                <p className="text-gray-700">
                  <strong>Changement d'avis :</strong> Les frais de retour sont à la charge du client.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Échanges
              </h2>
              <p className="text-gray-700 mb-4">
                Les échanges sont acceptés pour les raisons suivantes :
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Taille incorrecte (selon notre guide des tailles)
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Couleur différente de celle commandée
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Article défectueux ou endommagé
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.734 0L4.08 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Articles Non Remboursables
              </h2>
              <p className="text-gray-700 mb-4">
                Les articles suivants ne peuvent pas être retournés pour des raisons d'hygiène et de sécurité :
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Sous-vêtements et maillots de bain
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Articles personnalisés ou sur mesure
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Articles en promotion finale (clearance)
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Articles retournés après la période de 7 jours
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-text mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Nous Contacter
              </h2>
              <p className="text-gray-700 mb-4">
                Pour toute question concernant notre politique de remboursement ou pour initier un retour :
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-text">WhatsApp :</p>
                    <p className="text-gray-700">+213 XXX XXX XXX</p>
                  </div>
                  <div>
                    <p className="font-semibold text-text">Email :</p>
                    <p className="text-gray-700">contact@almezouara.dz</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-primary to-pink-600 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Besoin d'aide ?</h2>
            <p className="text-pink-100 mb-6">
              Notre équipe est là pour vous accompagner dans vos retours et échanges
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/+213XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-2.462-.996-4.779-2.811-6.598-1.815-1.819-4.145-2.817-6.609-2.817-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.281-.858zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                </svg>
                <span>Contacter via WhatsApp</span>
              </a>
              <a
                href="/contact"
                className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors duration-200 inline-flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Formulaire de Contact</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;

