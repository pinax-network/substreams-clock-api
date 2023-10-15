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
        /{chain}/timestamp?block_number=<positive integer>
        /{chain}/blocknum?timestamp=<UNIX or date>
        /{chain}/current
        /{chain}/final
`
    return text;
}