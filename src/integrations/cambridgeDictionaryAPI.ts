import type { Definition, DefinitionProvider, DictionaryWord, PartOfSpeech, Synonym, SynonymProvider } from "src/integrations/types";
import { requestUrl } from "obsidian";

class Base {
  name = "CambridgeDictionary";
  url?: "https://dictionary.cambridge.org/dictionary/";
  offline = false;
  supportedLanguages = [
      "cn",
  ];
}

export class CambridgeDictionaryDefinitionProvider extends Base implements DefinitionProvider {
    async requestDefinitions(query: string, lang: string): Promise<DictionaryWord> {
        console.log("iventest");
        const result = await requestUrl({
            url: `https://dictionary.cambridge.org/dictionary/english-chinese-simplified/${query.replace(/\s/g, '+')}`,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36' }
        });
        const doc = new DOMParser().parseFromString(result.text, 'text/html');
        console.log(result.text);
        const pageContent = doc.querySelector(`article[id="page-content"]`);
        console.log(pageContent);
        
        const page_info = pageContent.querySelector(`div[class="page"]`);

        const def: DictionaryWord = {
            phonetics: [],
            meanings: [],
            word: query
        };

        if(page_info) {
            console.log("this is", page_info)
            throw "";
        //     if(!page_info.hasChildNodes()) throw "";
        // console.log(page_info);

        // for (let index = 0; index < page_info.children.length; index++) {
        //     const element = page_info.childNodes[index];
        //     console.log(element.nodeName);
        // }
        } else {
            const data = doc.querySelector(`div[class="pr di superentry"]`);
            console.log(data)

            if (!data) throw "";

            const diBody = data.querySelector(`div[class="di-body"]`);
            console.log(diBody)
            const entryBodyList = diBody.querySelector(`div[class="entry-body"]`);
            console.log(entryBodyList)
            
            if (!entryBodyList.hasChildNodes()) throw "";

            for (let index = 0; index < entryBodyList.children.length; index++) {
                const entry = entryBodyList.children[index];
                console.log(entry)
                const itemHead = entry.querySelector(`div[class="pos-header dpos-h"]`)
                const usDpron = itemHead.querySelector(`span[class="us dpron-i "]`)
                // 音标
                const usDpronText = usDpron.querySelector(`span[class="pron dpron"]`).textContent
                console.log(usDpronText)
                def.phonetics.push({
                    text: usDpronText,
                    audio: "dictionary.cambridge.org"+usDpron.querySelector('amp-audio > source')?.getAttribute('src') ?? undefined
                });
                // 释义
                const itemBody = entry.querySelector(`div[class="pos-body"]`)
                for (let body_index = 0; body_index < itemBody.children.length; body_index++) {
                    const prDsence = itemBody.children[body_index];
                    if(prDsence.getAttributeNode("class").textContent.indexOf("pr dsense") == -1){
                        console.log(prDsence.getAttributeNode("class").textContent)
                        continue
                    }
                    // 词性
                    var partsOfSpeech:string = ""
                    if(prDsence.querySelector(`span[class="pos dsense_pos"]`)){
                        partsOfSpeech = prDsence.querySelector(`span[class="pos dsense_pos"]`).textContent;
                    }
                    console.log(partsOfSpeech)

                    // 定义
                    const defini: Definition[] = [];
                    const dsenseb = prDsence.querySelector(`div[class="sense-body dsense_b"]`)
                    for (let sensebIndex = 0; sensebIndex < dsenseb.children.length; sensebIndex++) {
                        const sense = dsenseb.children[sensebIndex];
                        var enDef: string = ""
                        var cnDef: string = ""
                        if(sense.querySelector(`div[class="def ddef_d db"]`)) {
                            enDef = sense.querySelector(`div[class="def ddef_d db"]`).textContent
                            console.log(enDef)
                        }
                        if(sense.querySelector(`span[class="trans dtrans dtrans-se  break-cj"]`)) {
                            cnDef = sense.querySelector(`span[class="trans dtrans dtrans-se  break-cj"]`).textContent
                            console.log(cnDef)
                        }
                        var exampleSen = ""
                        if(sense.querySelector(`div[class="examp dexamp"]`)) {
                            exampleSen = sense.querySelector(`div[class="examp dexamp"]`).textContent
                        }

                        console.log(exampleSen)
                        
                        defini.push({
                            definition: enDef,
                            example: undefined,
                            synonyms: undefined
                        })

                        defini.push({
                            definition: cnDef,
                            example: exampleSen,
                            synonyms: undefined
                        })
                    }
                    
                    def.meanings.push({
                        partOfSpeech: partsOfSpeech,
                        definitions: defini
                    });
                } 
            }
        }

        

        // //Something like noun
        // const type = data.querySelector('.vmod i')?.textContent;
        // if (type) {
        //     const defGenerator = (defs: NodeList) => {

        //         const out: Definition[] = [];
        //         const syns: string[] = [];
        //         const tmp = data.querySelectorAll('.lr_container div[role="button"] span');
        //         tmp.forEach((el) => {
        //             if (!el.parentElement?.getAttribute('data-topic') && el.textContent) {
        //                 syns.push(el.textContent.trim());
        //             }
        //         })
        //         defs.forEach((el, idx) => {
        //             out.push({
        //                 definition: el.textContent,
        //                 example: el.nextSibling?.textContent,
        //                 synonyms: !idx ? syns : undefined
        //             })
        //         })
        //         return out;
        //     }

        //     def.meanings.push({
        //         partOfSpeech: type,
        //         definitions: defGenerator(data.querySelectorAll('div[data-dobid="dfn"]'))
        //     });
        // }

        return def;
    }
}