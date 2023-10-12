import pkg from "../package.json" assert { type: "json" };

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
        /{chain}/timestamp?n=<block number> (Positive integer)
        /{chain}/blocknum?t=<timestamp> (UNIX or date)
        /{chain}/current
        /{chain}/final

    HTTP POST
        TODO
`
    return text;
}