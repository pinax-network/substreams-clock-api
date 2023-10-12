export function timestampQuery(blockchain: string, blocknum: number) {
    return {
        message: `Get block number #${blocknum} from ${blockchain} blockchain`
    };
}

export function supportedChains() {
    return ['EOS', 'ETH', 'UX', 'WAX'];
}