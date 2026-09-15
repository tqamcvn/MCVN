import unittest
from bot import candidates, row_values

class MappingTests(unittest.TestCase):
    def item(self, **changes):
        value=dict(at='2026-09-14T18:02:03Z', name='CS IH', email='cs@example.com', qa='QA A', session='Catchup', recap='Recap\n2 lines', document='=not a formula', next_steps='Next')
        value.update(changes)
        return value

    def test_mapping(self):
        row=row_values(self.item(), {})
        self.assertEqual(row, [2026,38,'Catchup','Normal','1:1','15-09-2026','01:02:03','CS IH','QA A','Complete','Recap\n2 lines','CS IH','=not a formula',1,'Next',''])

    def test_weeknum_not_iso(self):
        self.assertEqual(row_values(self.item(at='2021-01-01T01:00:00Z'), {})[1],1)
        self.assertEqual(row_values(self.item(at='2021-01-04T01:00:00Z'), {})[1],2)

    def test_missing_time_not_invented(self):
        for timestamp in [None,'2026-09-14','2026-09-14T01:00:00']:
            with self.assertRaises(ValueError):
                row_values(self.item(at=timestamp), {})

    def test_duplicates_and_demo(self):
        p={'id':'J1','csName':'CS IH','csEmail':'cs@example.com','rounds':[{'id':'R1','recap':'text','nextSteps':'next','actionType':'Training'}]}
        event={'id':1,'kind':'journey','payload':p,'op':'update'}
        self.assertEqual(candidates(event)[0]['key'],'journey:J1:R1')
        self.assertEqual(candidates(dict(event,kind='history')),[])
        self.assertEqual(candidates(dict(event,op='delete')),[])
        self.assertEqual(candidates(dict(event,payload=dict(p,demo=True))),[])

if __name__=='__main__':
    unittest.main()
