(() => {
  const catalog = window.PATRIMONIO_CATALOG;
  if (!catalog) return;

  const diplomasAExcluir = new Set([
    "lei-n-º-53-2012-de-5-de-setembro",
    "lei-n-º-19-2014-de-14-de-abril",
    "lei-n-º-26-2016-de-22-de-agosto",
    "portaria-n-º-112-2023-de-27-de-abril",
    "resolucao-do-conselho-de-ministros-n-º-125-2026-de-17-de-junho"
  ]);

  catalog.legislacao?.forEach(category => {
    category.items = category.items.filter(item => !diplomasAExcluir.has(item.recordId));
  });

  const transversal = catalog.legislacao?.find(category => category.id === "transversal");
  if (transversal) {
    const novosDiplomas = [
      {
        title: "Decreto-Lei n.º 35/2018, de 18 de maio",
        description: "Procede à primeira alteração ao regime do Fundo de Salvaguarda do Património Cultural, adequando os seus órgãos à estrutura dos serviços da cultura e afetando ao Fundo receitas provenientes de coimas.",
        viewUrl: "https://drive.google.com/file/d/1VqKq_7SYI_1ka5TKy8mUEKPQw5aXR6qr/view?usp=drive_link",
        downloadUrl: "https://drive.google.com/uc?export=download&id=1VqKq_7SYI_1ka5TKy8mUEKPQw5aXR6qr",
        recordId: "decreto-lei-n-º-35-2018-de-18-de-maio"
      },
      {
        title: "Decreto-Lei n.º 42/2021, de 7 de junho",
        description: "Procede à segunda alteração ao regime do Fundo de Salvaguarda do Património Cultural, reforçando o financiamento de investimentos urgentes em património imóvel classificado do Estado e aditando novas fontes de receita.",
        viewUrl: "https://drive.google.com/file/d/14bK_rJ6a1XIm2uzENzscARIRbIi-unK_/view?usp=drive_link",
        downloadUrl: "https://drive.google.com/uc?export=download&id=14bK_rJ6a1XIm2uzENzscARIRbIi-unK_",
        recordId: "decreto-lei-n-º-42-2021-de-7-de-junho"
      }
    ];
    novosDiplomas.forEach(item => {
      if (!transversal.items.some(existing => existing.recordId === item.recordId)) {
        transversal.items.push(item);
      }
    });
  }

  const exibidos = catalog.multimedia?.find(category => category.id === "exibidos");
  if (exibidos) {
    const novosVideos = [
      ["Barro preto de Bisalhães", "1IoBhABihhOZ25SX7MD6cgADRFOARy03i", "barro-preto-de-bisalhaes"],
      ["Muros de pedra solta", "1UaXGASDKFxbHWwgFl-CDU0WY-CX7pQFp", "muros-de-pedra-solta"],
      ["Teatro Dom Roberto", "1Kh9XjogZwhvxd2I855ZJiK4yLyfVkbBU", "teatro-dom-roberto"],
      ["Tomar Cidade Templária", "1gM0krIFp4BWR8GryIx7xue-nEumEn0RP", "tomar-cidade-templaria"],
      ["Visita Guiada à Exposição René Lalique e a Idade do Vidro", "1uODTEoHG2wQ18mPI5LFIod0rDDNu_DGc", "visita-guiada-a-exposicao-rene-lalique-e-a-idade-do-vidro"]
    ].map(([title, id, recordId]) => ({
      title,
      description: "Vídeo exibido nas aulas.",
      viewUrl: `https://drive.google.com/file/d/${id}/view?usp=drive_link`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      viewLabel: "Ver vídeo",
      downloadLabel: "Transferir vídeo",
      recordId,
      iconLabel: "VÍDEO"
    }));

    novosVideos.forEach(item => {
      if (!exibidos.items.some(existing => existing.recordId === item.recordId)) {
        exibidos.items.push(item);
      }
    });
  }
})();
