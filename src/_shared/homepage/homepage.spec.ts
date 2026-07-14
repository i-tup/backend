import type { Source } from '../../apps/api/api.d';
import { getProjectsFromHTML } from './homepage';

describe('getProjectsFromHTML', () => {
    const FN = getProjectsFromHTML;
    const IMAGE = 'https://www.static.tu.berlin/fileadmin/csm_Fieldwork_Harz_';
    const HTML = `
    <article class="teaser">
        <figure class="teaser__image img-wrap">
            <img loading="lazy" srcset="${IMAGE}229d8a2591.jpeg 640w,
                ${IMAGE}18dd1493a3.jpeg 960w,
                ${IMAGE}20fd8d9479.jpeg 1280w" sizes="(min-width: 992px) calc(50vw - 80px),
                (max-width: 991px) calc(100vw - 40px)" src="${IMAGE}18dd1493a3.jpeg" width="960" height="540" alt="">
            <small class="copyright"><i>©</i>&nbsp;R. Jackisch</small>
        </figure>
        <div class="teaser__content">
            <h3 class="teaser__header">My Title</h3>
            <div class="teaser__text">
                <p>A Description. </p>
            </div>
            <footer class="teaser__buttonWrapper">
                <a href="/my/link" target="_blank" title="My Title" class="teaser__link"><span class="button ">mehr</span></a>
            </footer>
        </div>
    </article>`;
    const SOURCE: Source = {
        url: 'https://www.tu.berlin/geoinformation/forschung/projekte/laufende-projekte/',
        institution: 'Geoinformation in der Umweltplanung',
        status: 'current',
    };

    it('should extract project data from HTML', () => {
        const EXPECTED = [
            {
                id: 'my_title',
                name: 'My Title',
                description: 'A Description.',
                image: `${IMAGE}18dd1493a3.jpeg`,
                url: SOURCE.url,
                institution: SOURCE.institution,
                status: SOURCE.status,
                source: 'tu.berlin',
                goals: [],
                last_updated: expect.any(String),
                building: 'unknown',
                co2e: 0,
                lead: 'unknown',
                base: 0,
                cost: 0,
                eur: 0,
                kpi: {
                    carbon: 0,
                    cost: 0,
                    sdg: 0,
                    lockin: 0,
                    data: 0,
                },
                synenergies: [],
                dimension: 'Digital',
            },
        ];
        expect(FN(HTML, SOURCE)).toEqual(EXPECTED);
    });
});
