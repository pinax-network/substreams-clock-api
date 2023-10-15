import pkg from "../package.json";

// https://fsymbols.com/generators/carty/
export function banner()  {
    let text =`

    ░█████╗░██╗░░░░░░█████╗░░█████╗░██╗░░██╗  ░█████╗░██████╗░██╗
    ██╔══██╗██║░░░░░██╔══██╗██╔══██╗██║░██╔╝  ██╔══██╗██╔══██╗██║
    ██║░░╚═╝██║░░░░░██║░░██║██║░░╚═╝█████═╝░  ███████║██████╔╝██║
    ██║░░██╗██║░░░░░██║░░██║██║░░██╗██╔═██╗░  ██╔══██║██╔═══╝░██║
    ╚█████╔╝███████╗╚█████╔╝╚█████╔╝██║░╚██╗  ██║░░██║██║░░░░░██║
    ░╚════╝░╚══════╝░╚════╝░░╚════╝░╚═╝░░╚═╝  ╚═╝░░╚═╝╚═╝░░░░░╚═╝

`
    text += `   🚀 ${pkg.description} (v${pkg.version})

    Documentation: ${pkg.homepage}

    HTTP GET
        /chains
        /health
        /openapi
        /swagger
        /{chain}/timestamp?block_number=<positive integer or comma-separated>
        /{chain}/blocknum?timestamp=<UNIX or date or comma-separated>
        /{chain}/current
        /{chain}/final
`
    return text;
}