import { useState } from "react";
import Navbar from "./Layouts/Navbar";
import Footer from "./Layouts/Footer";

import { PruebaCards } from "./CrudAdmin/PruebaCards";
import Reviews from "./Layouts/Reviews";

export const CrudAdmin = () => {
  const [activeView, setActiveView] = useState("dashboard");

  const renderContent = () => {
    if (activeView === "dashboard") {
      return (
        <>
          <PruebaCards />
          <Reviews />
        </>
      );
    }

    const viewContent = {
      usuarios: {
        title: "Usuarios",
        description:
          "Modulo administrativo reservado para perfiles y permisos. La evaluacion se enfoca en el flujo de despachos desplegado en EKS.",
      },
      productos: {
        title: "Productos",
        description:
          "Modulo de catalogo reservado para una siguiente iteracion. El despliegue actual valida frontend, backend, ECR, HPA y comunicacion entre servicios.",
      },
      configuracion: {
        title: "Configuracion",
        description:
          "Ambiente conectado a Kubernetes mediante Services internos y LoadBalancer publico. El pipeline CI/CD publica imagenes en ECR y despliega a EKS.",
      },
    };

    const content = viewContent[activeView];

    return (
      <section className="mx-auto mt-16 max-w-4xl rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
        <h1 className="mb-4 text-3xl font-bold text-teal-700">
          {content.title}
        </h1>
        <p className="text-xl leading-8 text-slate-700">
          {content.description}
        </p>
      </section>
    );
  };

  return (
    <>
      <div className="grid grid-cols-[auto_1fr] min-h-screen bg-gray-50">
        <div className="col-span-1">
          <Navbar activeView={activeView} onChangeView={setActiveView} />
        </div>

        <div className="overflow-y-auto p-6">
          {renderContent()}
          <Footer />
        </div>
      </div>
    </>
  );
};
