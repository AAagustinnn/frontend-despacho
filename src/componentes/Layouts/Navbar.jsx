function Navbar({ activeView, onChangeView }) {
  const menuItems = [
    { id: "dashboard", label: "Despachos" },
    { id: "usuarios", label: "Usuarios" },
    { id: "productos", label: "Productos" },
    { id: "configuracion", label: "Configuracion" },
  ];

  return (
    <nav className="rounded-xl w-[250px] min-h-[880px] bg-teal-600 text-white sticky top-0 p-4 m-4">
      <h2 className="text-xl font-bold mb-8">Despacho Dashboard</h2>

      <ul className="space-y-3">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`block w-full text-left font-bold py-2 px-3 rounded transition-colors ${
                activeView === item.id ? "bg-teal-800" : "hover:bg-teal-700"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
