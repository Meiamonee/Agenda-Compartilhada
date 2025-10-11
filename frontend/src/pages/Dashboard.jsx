export default function Dashboard() {
  // Tenta buscar o objeto de usuário do localStorage.
  const userString = localStorage.getItem("user");
  let user = {};

  try {
    // Tenta fazer o parse do JSON
    user = userString ? JSON.parse(userString) : {};
  } catch (error) {
    // Em caso de erro no parse (JSON malformado), define o usuário como vazio.
    console.error("Erro ao analisar dados do usuário no localStorage:", error);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          Bem-vindo, {user.nome || "Usuário"}!
        </h1>
        <p className="text-gray-400 mb-6">Esta é a sua área de Dashboard.</p>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Informações da Sessão</h2>
            {/* Exemplo de exibição de outras propriedades do usuário, se existirem */}
            {user.email && (
                <p className="text-left text-sm text-gray-300">
                    <span className="font-medium text-gray-100">Email:</span> {user.email}
                </p>
            )}
            {/* Adicione um botão de logout funcional aqui quando necessário */}
        </div>
      </div>
    </div>
  );
}